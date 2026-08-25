"use server";

import { GoogleGenAI } from "@google/genai";
import { InvoiceLineItemInput } from "@/types";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GEMINI_MODEL = "gemini-3.7-flash";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "openai/gpt-oss-20b";
const MAX_INPUT_LENGTH = 1000;
const AI_TIMEOUT_MS = 18_000;
const GROQ_TIMEOUT_MS = 12_000;

const QUANTITY_RE = /(?:^|[\s,])(\d+)\s*[x×]\s*([A-Za-z][A-Za-z0-9\s&.,\-/]+?)(?:\s+(?:at|@|for)\s*)?(?:₦|Naira|NGN|\$|USD|€|EUR|£|GBP)?\s*([\d,]+(?:\.\d+)?)/gi;
const CURRENCY_RE = /(?:₦|Naira|NGN|\$|USD|€|EUR|£|GBP)\s*([\d,]+(?:\.\d+)?)/gi;
const NUMBER_RE = /([\d,]+(?:\.\d+)?)/g;
const COPIES_RE = /(\d+)\s+copies?/gi;
const DISCOUNT_RE = /(?:discount\s+(?:of\s+)?|less\s+|give\s+(?:her\s+)?(?:a\s+)?discount\s+(?:of\s+)?|deduct\s+)([\d,]+(?:\.\d+)?)/gi;

function parseNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function extractItemsFromText(text: string): InvoiceLineItemInput[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const items: InvoiceLineItemInput[] = [];
  const seen = new Set<string>();

  const segments = trimmed.split(/(?:\s+then\s+|\s+also\s+|\s+plus\s+|\s+and\s+(?![a-z]+ing))/i);

  for (const segment of segments) {
    const cleanSegment = segment.trim();
    if (!cleanSegment) continue;

    const quantityMatches = [...cleanSegment.matchAll(QUANTITY_RE)];
    const copiesMatches = [...cleanSegment.matchAll(COPIES_RE)];
    const copiesCount = copiesMatches.length > 0 ? parseInt(copiesMatches[0][1], 10) : 1;
    const discountMatch = [...cleanSegment.matchAll(DISCOUNT_RE)];
    const discountAmount = discountMatch.length > 0 ? parseNumber(discountMatch[0][1]) : 0;

    if (quantityMatches.length > 0) {
      for (const match of quantityMatches) {
        const quantity = parseInt(match[1], 10) || 1;
        const description = match[2].trim();
        const price = parseNumber(match[3] || "0");
        const key = description.toLowerCase();
        if (!seen.has(key) && description.length > 1 && price > 0) {
          seen.add(key);
          items.push({
            description: description.charAt(0).toUpperCase() + description.slice(1),
            quantity: Math.max(1, quantity),
            unit_price: Math.max(0, price),
            discount_amount: discountAmount > 0 ? discountAmount : 0,
            discount_type: "fixed",
            tax_rate: 0,
          });
        }
      }
      continue;
    }

    const currencyMatches = [...cleanSegment.matchAll(CURRENCY_RE)];
    if (currencyMatches.length > 0) {
      for (const match of currencyMatches) {
        const price = parseNumber(match[1]);
        const beforePrice = cleanSegment.substring(0, match.index).trim();
        const afterPrice = cleanSegment.substring(match.index + match[0].length).trim();
        const description = [
          beforePrice,
          afterPrice,
        ]
          .join(" ")
          .replace(DISCOUNT_RE, " ")
          .replace(NUMBER_RE, " ")
          .replace(/[:\-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const cleanDescription = description
          .replace(/^(i\s+(did|made|created|designed|built|printed|wrote|developed|worked\s+on)\s+)/i, "")
          .replace(/\s+for\s+[A-Z][a-z]+/g, "")
          .replace(/^(a|an|the)\s+/i, "")
          .trim();

        const finalDescription = cleanDescription || description;
        const key = finalDescription.toLowerCase();
        if (!seen.has(key) && finalDescription.length > 1 && price > 0) {
          seen.add(key);
          items.push({
            description: finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1),
            quantity: Math.max(1, copiesCount),
            unit_price: Math.max(0, price),
            discount_amount: discountAmount > 0 ? discountAmount : 0,
            discount_type: "fixed",
            tax_rate: 0,
          });
        }
      }
      continue;
    }
  }

  if (items.length === 0) {
    const genericNumbers = [...trimmed.matchAll(NUMBER_RE)];
    if (genericNumbers.length > 0) {
      const largestNumber = genericNumbers.reduce((a, b) =>
        parseNumber(a[1]) > parseNumber(b[1]) ? a : b,
      );
      const price = parseNumber(largestNumber[1]);
      if (price > 0) {
        const description = trimmed
          .replace(NUMBER_RE, " ")
          .replace(/[:\-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (description.length > 1) {
          items.push({
            description: description.charAt(0).toUpperCase() + description.slice(1),
            quantity: 1,
            unit_price: Math.max(0, price),
            discount_amount: 0,
            discount_type: "fixed",
            tax_rate: 0,
          });
        }
      }
    }
  }

  return items;
}

function validateItems(items: unknown[]): InvoiceLineItemInput[] {
  const validated: InvoiceLineItemInput[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const obj = item as Record<string, unknown>;
    const description = typeof obj.description === "string" ? obj.description.trim() : "";
    const quantity = typeof obj.quantity === "number" ? obj.quantity : Number(obj.quantity) || 1;
    const unit_price = typeof obj.unit_price === "number" ? obj.unit_price : Number(obj.unit_price) || 0;
    const discount_amount = typeof obj.discount_amount === "number" ? obj.discount_amount : Number(obj.discount_amount) || 0;
    const discount_type = typeof obj.discount_type === "string" ? obj.discount_type : "fixed";
    const tax_rate = typeof obj.tax_rate === "number" ? obj.tax_rate : Number(obj.tax_rate) || 0;

    if (description.length === 0) {
      continue;
    }
    if (quantity <= 0) {
      continue;
    }
    if (unit_price < 0) {
      continue;
    }
    if (discount_amount < 0) {
      continue;
    }
    if (discount_type !== "percentage" && discount_type !== "fixed") {
      continue;
    }
    if (tax_rate < 0 || tax_rate > 100) {
      continue;
    }

    validated.push({
      description,
      quantity: Math.max(1, Math.round(quantity * 100) / 100),
      unit_price: Math.max(0, Math.round(unit_price * 100) / 100),
      discount_amount: Math.max(0, Math.round(discount_amount * 100) / 100),
      discount_type: discount_type === "percentage" ? "percentage" : "fixed",
      tax_rate: Math.max(0, Math.min(100, Math.round(tax_rate * 100) / 100)),
    });
  }

  return validated;
}

async function parseWithGemini(text: string): Promise<InvoiceLineItemInput[] | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const trimmed = text.trim().slice(0, MAX_INPUT_LENGTH);

  const prompt = `You are an invoice parsing assistant for a Nigerian freelancer.

User input: "${trimmed}"

Rules:
- "Discount of X" applies to the preceding service.
- "Then", "also", "plus" = separate line items.
- "costed" = price. "thousand naira" = multiply by 1000.
- Clean descriptions: remove filler words.
- If discount has no clear target, attach to most recent priced service.

Return ONLY JSON:
{"items":[{"description":"Website design","quantity":1,"unit_price":300000,"discount_amount":40000,"discount_type":"fixed","tax_rate":0},{"description":"Hosting","quantity":1,"unit_price":40000,"discount_amount":0,"discount_type":"fixed","tax_rate":0}]}`;

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("AI request timed out")), AI_TIMEOUT_MS);
    });

    const result = await Promise.race([
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["TEXT"],
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    quantity: { type: "number" },
                    unit_price: { type: "number" },
                    discount_amount: { type: "number" },
                    discount_type: { type: "string", enum: ["percentage", "fixed"] },
                    tax_rate: { type: "number" },
                  },
                  required: ["description", "quantity", "unit_price"],
                },
              },
            },
            required: ["items"],
          },
        },
      }),
      timeoutPromise,
    ]);

    const textResponse = result.text?.trim();
    if (!textResponse) {
      return null;
    }

    const parsed = JSON.parse(textResponse) as { items?: unknown[] };
    const validated = validateItems(parsed.items || []);
    return validated.length > 0 ? validated : null;
  } catch {
    return null;
  }
}

async function parseWithGroq(text: string): Promise<InvoiceLineItemInput[] | null> {
  if (!GROQ_API_KEY) {
    return null;
  }

  const trimmed = text.trim().slice(0, MAX_INPUT_LENGTH);

  const prompt = `You are an invoice parsing assistant for a Nigerian freelancer.

User input: "${trimmed}"

Rules:
- "Discount of X" applies to the preceding service.
- "Then", "also", "plus" = separate line items.
- "costed" = price. "thousand naira" = multiply by 1000.
- Clean descriptions: remove filler words.
- If discount has no clear target, attach to most recent priced service.

Return ONLY JSON:
{"items":[{"description":"Website design","quantity":1,"unit_price":300000,"discount_amount":40000,"discount_type":"fixed","tax_rate":0},{"description":"Hosting","quantity":1,"unit_price":40000,"discount_amount":0,"discount_type":"fixed","tax_rate":0}]}`;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Groq request timed out")), GROQ_TIMEOUT_MS);
    });

    const response = await Promise.race([
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You only respond with valid JSON. No markdown.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      }),
      timeoutPromise,
    ]);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content?.trim();
    if (!textResponse) {
      return null;
    }

    const parsed = JSON.parse(textResponse) as { items?: unknown[] };
    const validated = validateItems(parsed.items || []);
    return validated.length > 0 ? validated : null;
  } catch {
    return null;
  }
}

export async function parseInvoiceFromText(
  text: string,
): Promise<{ items: InvoiceLineItemInput[]; usedAI: boolean }> {
  if (!text || text.trim().length === 0) {
    return { items: [], usedAI: false };
  }

  const trimmed = text.trim().slice(0, MAX_INPUT_LENGTH);

  const [geminiResult, groqResult] = await Promise.all([
    parseWithGemini(trimmed),
    parseWithGroq(trimmed),
  ]);

  const aiResult = geminiResult || groqResult;
  if (aiResult && aiResult.length > 0) {
    return { items: aiResult, usedAI: true };
  }

  const fallbackItems = extractItemsFromText(trimmed);
  return { items: fallbackItems, usedAI: false };
}

export async function parseNaturalLanguage(
  text: string,
): Promise<InvoiceLineItemInput[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const trimmed = text.trim().slice(0, MAX_INPUT_LENGTH);
  return extractItemsFromText(trimmed);
}
