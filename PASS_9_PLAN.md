# PASS 9 — Reminders + Automation + AI: Implementation Plan

## 1. Current State Audit

### What exists
- **Invoices**: Full CRUD, atomic RPCs (`create_invoice_with_items`, `update_invoice_with_items`), line items with description, qty, unit_price, discount, tax.
- **Customers**: CRUD, search. Customer detail page has an empty "Invoice History" card placeholder — no actual history data is fetched.
- **Dashboard**: Aggregate stats via `get_dashboard_stats` RPC — total_invoiced, paid, outstanding, overdue (all business-level).
- **Invoice statuses**: `draft`, `sent`, `paid`, `cancelled`. `overdue` is computed dynamically (`status = 'sent'` AND `due_date < today`).
- **Invoice items**: Structured enough for memory — `description`, `quantity`, `unit_price`, `discount_amount`, `discount_type`, `tax_rate`, `tax_amount`, `total`.
- **Business settings**: currency, payment terms, brand colour, logo, invoice prefix — all support reminder text formatting.
- **PDF/Print/Share**: PASS 8 complete. Clipboard-only sharing. No email delivery.
- **No external APIs**: No email provider, no SMS, no WhatsApp API, no AI API, no payment gateway.

### What does NOT exist
- No reminder generation or "send" workflow.
- No reminder history tracking.
- No customer-level financial metrics (per-customer totals, paid count, outstanding, overdue).
- No customer invoice history (the card is an empty placeholder).
- No invoice memory / frequently-used-services suggestion.
- No AI Quick Invoice functionality (marketing section only).
- No `last_reminded_at` or reminder tables.
- No email/SMS/WhatsApp delivery infrastructure.

---

## 2. Roadmap Comparison

| Roadmap Requirement | Current State | Missing Pieces |
|---|---|---|
| Payment reminders / follow-up assistance | None | Reminder text generation, copy actions, reminder tracking |
| Invoice memory (frequently used services) | Raw data exists in `invoice_items` | No aggregation, no UI surface in invoice builder |
| Customer intelligence (per-customer totals) | Aggregate stats only at business level | Per-customer breakdown, invoice history, frequently purchased services |
| AI Quick Invoice (NL → structured items) | Static marketing section only | AI parser abstraction, free AI provider integration, builder integration |

**Conclusion**: All four PASS 9 features need implementation. No PASS 9 work was partially done in earlier passes.

---

## 3. PASS 9 Objective

Add four cohesive intelligence/automation features to Remitovate that work together to reduce repetitive invoicing work, while maintaining the zero-capital constraint and existing data model integrity.

The intended user flow is:
```
Invoice detail → Reminder assistance (get paid faster)
Customer detail → Intelligence (understand the relationship)
Invoice builder → Memory suggestions (type less)
Invoice builder → AI Quick Invoice (type naturally)
```

---

## 4. Architecture Principles

1. **Zero-capital first**: Every feature must work without paid APIs.
2. **Server-side trust boundary**: All data aggregation and AI calls happen in server actions.
3. **Graceful degradation**: Features degrade to simpler alternatives when ideal data or APIs are unavailable.
4. **User remains in control**: AI output and memory suggestions are drafts for user review — never auto-persisted.
5. **Minimal database changes**: Prefer queries over new tables. New columns over new tables where a single attribute suffices.
6. **No false claims**: Never claim a reminder was "sent" if Remitovate did not actually send it.
7. **Provider-agnostic AI**: AI calls go through a small abstraction so the provider can be replaced without rewriting the invoice builder.

---

## 5. Feature 1 — Payment Reminders / Follow-Up Assistance

### User problem
Business owners forget to follow up on overdue invoices. They need a quick way to generate a polite, contextual reminder message without leaving the app.

### Proposed UX
On the invoice detail page (`/invoices/[id]`), below the Share dropdown, add a **"Remind"** button (visible only for `sent` and `overdue` invoices). Clicking it opens a small dialog with:

1. **Email reminder text** — pre-formatted email body with customer name, invoice number, amount, due date, business payment info. Copy button + "Open email" (mailto:) button.
2. **WhatsApp reminder text** — pre-formatted WhatsApp message with the same details. Copy button + "Open WhatsApp" (wa.me) button if customer has a phone number.
3. **Status**: Never says "Reminder sent." Instead shows context like "Last copied: just now" or nothing at all.

### Data required
- Business name, email, payment information
- Customer name, email, phone
- Invoice number, total, due date, status (overdue vs sent)

All data is already available via `getInvoiceById`.

### Database changes
**New column on `invoices`**: `last_reminded_at TIMESTAMPTZ` (nullable).

```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;
```

This is a single, non-destructive column addition. No new tables. No data migration needed.

**Migration**: `20240101000006_payment_reminders.sql`

### RLS / Security
- Existing `invoices` RLS policies cover SELECT and UPDATE on the column.
- Server action updates `last_reminded_at` only for invoices in the user's own business.

### Server actions
New file: `app/actions/reminders.ts`

```typescript
// Generates reminder text for an invoice (server-side to keep templates centralized)
generateReminderText(invoiceId: string): Promise<{ email: string; whatsapp: string } | null>

// Records that a reminder was copied/sent (updates last_reminded_at)
recordReminderSent(invoiceId: string): Promise<{ success: true } | { error: string }>
```

### Components
- `components/invoices/invoice-reminder-dialog.tsx` — dialog with email/WhatsApp text, copy buttons, mailto/wa.me links.

### Routes
- No new routes. Feature lives on `/invoices/[id]` (detail page).

### Zero-cost strategy
- **What is free**: Text generation, copy-to-clipboard, `mailto:` links, `wa.me` links — all browser APIs and protocols.
- **What has limits**: Clipboard API requires HTTPS (already the case on Vercel). `wa.me` opens the WhatsApp app/web — no API key needed for the link itself.
- **What could cost money**: Actual automated email/SMS sending via a provider (Resend, Twilio). We do NOT implement this. Users copy/open the message themselves.
- **MVP approach**: Generate → Copy → User sends manually.

### Edge cases
- Customer has no phone → hide WhatsApp option.
- Customer has no email → hide email option (though all customers have email per current schema).
- Draft invoices → no reminder button (invoice not yet sent).
- Paid/cancelled invoices → no reminder button.
- Very long payment info → truncate in reminder text.
- Clipboard API unavailable (rare on HTTPS) → show error toast.

---

## 6. Feature 2 — Invoice Memory (Frequently Used Services)

### User problem
Business owners repeatedly type the same service descriptions and prices. They waste time re-entering "Website Development", "Monthly Maintenance", etc.

### Proposed UX
In the invoice builder (`/invoices/new` and `/invoices/[id]/edit`), above the line items list, add a **"Suggestions"** section. When the builder loads (or when the customer changes), fetch and display up to 5 frequently-used service descriptions for:
1. **This customer specifically** (services this customer has been invoiced for before).
2. **All customers** (business-wide frequently used services).

Each suggestion is a pill/button. Clicking it:
- Adds a new line item with the suggestion's description.
- Pre-fills `unit_price` from the most recent usage.
- Pre-fills `quantity: 1`.
- Does NOT overwrite existing line items.

### Data required
- Historical `invoice_items` with `description`, `unit_price`, `invoice_id`.
- Join with `invoices` to filter by `business_id` and optionally `customer_id`.

### Database changes
**None**. Data is already in `invoice_items` and `invoices`.

### RLS / Security
- Server action queries `invoice_items` joined with `invoices`, scoped by `business_id`.
- Customer-specific suggestions additionally filter by `customer_id`.
- RLS ensures the user only sees their own business's data.

### Server actions
New file: `app/actions/invoice-memory.ts`

```typescript
// Returns top N frequent service descriptions with latest unit price
// for the entire business (all-time or last 90 days)
getFrequentServices(businessId: string, limit?: number): Promise<ServiceSuggestion[]>

// Returns frequent services for a specific customer
getFrequentServicesForCustomer(businessId: string, customerId: string, limit?: number): Promise<ServiceSuggestion[]>
```

```typescript
interface ServiceSuggestion {
  description: string;
  latestUnitPrice: number;
  usageCount: number;
}
```

### Query strategy
Use a single SQL query per action:

```sql
SELECT 
  ii.description,
  COUNT(*) as usage_count,
  MAX(ii.unit_price) as latest_unit_price
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE i.business_id = p_business_id
  AND i.status NOT IN ('draft', 'cancelled')
GROUP BY ii.description
ORDER BY usage_count DESC, MAX(i.created_at) DESC
LIMIT p_limit;
```

For customer-specific, add `AND i.customer_id = p_customer_id`.

Index on `invoice_items.description` is not strictly necessary for MVP (small datasets), but we should ensure the join on `invoices.business_id` uses the existing index.

### Components
- `components/invoices/invoice-suggestions.tsx` — pill list of suggestions, clickable, with loading state.
- Integrated into `InvoiceBuilder` above the line items.

### Routes
- No new routes. Integrated into `/invoices/new` and `/invoices/[id]/edit`.

### Zero-cost strategy
- **What is free**: Pure SQL aggregation on existing data.
- **What has limits**: None for MVP. Queries are fast with existing indexes for small-to-medium datasets.
- **What could cost money**: Nothing.

### Edge cases
- No history → show empty suggestions state ("No suggestions yet. Create more invoices to see frequent services.")
- Same description with different prices → use most recent price, but user can edit.
- New invoice with no customer selected → show only business-wide suggestions.
- User clicks suggestion while items exist → adds as new item, doesn't overwrite.
- Draft invoices are excluded from suggestions (per PASS 7 philosophy: drafts are not real transactions).

---

## 7. Feature 3 — Customer Intelligence

### User problem
Business owners don't have a quick view of how much a customer owes, how much they've paid historically, or what services they buy most.

### Proposed UX
On the customer detail page (`/customers/[id]`), replace the current empty placeholder sections with real data:

1. **Financial Summary** (new section, above Contact Information):
   - Total Invoiced
   - Total Paid
   - Outstanding (sent, not overdue)
   - Overdue
   - Invoice count
   - Paid count
   - Latest invoice date

2. **Frequently Purchased Services** (new section, below Contact Information):
   - Top 5 service descriptions this customer has been invoiced for.
   - With usage count and latest price.

3. **Invoice History** (replaces the current empty placeholder):
   - Table/card list of all invoices for this customer.
   - Shows: invoice number, date, status, total.
   - Links to invoice detail.

### Data required
- All invoices for the customer, with totals and statuses.
- Invoice items for those invoices (for frequent services).

### Database changes
**None**. All data exists in `invoices` and `invoice_items`.

### RLS / Security
- Server actions derive `business_id` from `auth.uid()`.
- Customer detail page already verifies customer belongs to business.
- Customer intelligence data is scoped by `business_id` + `customer_id`.

### Server actions
New file: `app/actions/customer-intelligence.ts`

```typescript
// Returns per-customer financial metrics
getCustomerIntelligence(customerId: string): Promise<CustomerIntelligence | null>

// Returns invoice history for a customer
getCustomerInvoiceHistory(customerId: string): Promise<InvoiceHistoryEntry[]>

// Returns frequently purchased services for a customer
getCustomerFrequentServices(customerId: string, limit?: number): Promise<ServiceSuggestion[]>
```

```typescript
interface CustomerIntelligence {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
  paidCount: number;
  outstandingCount: number;
  overdueCount: number;
  latestInvoiceDate: string | null;
  currency: string;
}

interface InvoiceHistoryEntry {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  total: number;
}
```

### Query strategy
Option A: Multiple lightweight queries (simpler, acceptable for MVP).
Option B: Single RPC (more efficient, preferred for production).

**Recommended**: Single RPC `get_customer_intelligence(p_customer_id)` that returns the aggregate metrics. Then a separate query for invoice history.

```sql
CREATE OR REPLACE FUNCTION get_customer_intelligence(p_customer_id uuid)
RETURNS TABLE (
  total_invoiced numeric,
  total_paid numeric,
  total_outstanding numeric,
  total_overdue numeric,
  invoice_count bigint,
  paid_count bigint,
  outstanding_count bigint,
  overdue_count bigint,
  latest_invoice_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status NOT IN ('draft', 'cancelled') THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND due_date >= CURRENT_DATE THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN total ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN status = 'paid' THEN 1 END),
    COUNT(CASE WHEN status = 'sent' AND due_date >= CURRENT_DATE THEN 1 END),
    COUNT(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN 1 END),
    MAX(invoice_date)
  FROM invoices
  WHERE customer_id = p_customer_id
    AND business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE;
```

**Important**: This RPC relies on RLS (`SECURITY INVOKER`) and the caller's business ownership. The `business_id IN (SELECT ...)` ensures the user can only query their own business's customer data.

For frequent services, a server action query is sufficient:

```sql
SELECT ii.description, COUNT(*) as usage_count, MAX(ii.unit_price) as latest_unit_price
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE i.customer_id = p_customer_id
  AND i.business_id = p_business_id
  AND i.status NOT IN ('draft', 'cancelled')
GROUP BY ii.description
ORDER BY usage_count DESC, MAX(i.created_at) DESC
LIMIT p_limit;
```

### Components
- `components/customers/customer-intelligence.tsx` — financial summary cards.
- `components/customers/customer-frequent-services.tsx` — pill list of frequent services.
- `components/customers/customer-invoice-history.tsx` — invoice list for this customer.
- Update `components/customers/customer-detail.tsx` to include these sections.

### Routes
- No new routes. Updates `/customers/[id]`.

### Zero-cost strategy
- **What is free**: Pure SQL aggregation.
- **What has limits**: None.
- **What could cost money**: Nothing.

### Edge cases
- Customer with no invoices → show zero metrics and empty states.
- Customer with only drafts → drafts excluded from totals (consistent with dashboard logic).
- Deleted customer with orphaned invoices → `ON DELETE SET NULL` preserves history, but `customer_id` is null, so intelligence won't show them. This is correct behavior.

---

## 8. Feature 4 — AI Quick Invoice

### User problem
Business owners want to create invoices quickly by describing them in natural language rather than filling out forms.

### Proposed UX
In the invoice builder (`/invoices/new` and `/invoices/[id]/edit`), add an **"AI Quick Add"** section above the line items.

1. User types natural language: `"Website development for ABC Ltd, 3 pages, ₦150,000, plus hosting ₦20,000"`
2. Clicks "Generate" (explicit action — no auto-send on keystroke).
3. If AI is available: AI processes the text and returns structured line items.
4. If AI is unavailable: deterministic parser processes the text.
5. System shows parsed line items in a preview card with Edit/Add buttons.
6. User reviews, edits if needed, clicks "Add to Invoice".
7. Items are added to the existing line items list.
8. **AI never directly saves or creates an invoice.**

### AI Provider Selection

After researching currently available free AI APIs (August 2026), the recommended provider for PASS 9 is:

**Primary: Google Gemini API (Free Tier)**

| Attribute | Value |
|---|---|
| Provider | Google AI Studio (`aistudio.google.com`) |
| Recommended model | `gemini-3.7-flash` |
| Free tier | Yes — ongoing, no expiration |
| Credit card required | No |
| API key required | Yes — server-side only (`GOOGLE_GENERATIVE_AI_API_KEY`) |
| Free tier limits | 10 RPM, 250,000 TPM, 1,500 RPD (Flash models) |
| Structured JSON support | Yes — `response_format` with `mime_type: "application/json"` and JSON schema |
| Expected MVP cost | $0 |
| Sustainability | Standing free tier, not trial credits |
| Replaceable | Yes — abstraction layer allows swapping provider |

**Fallback: Deterministic parser (regex-based)**

Always available. No external dependency. Handles common invoicing patterns.

### AI abstraction architecture

```
parseInvoiceWithAI(text: string, businessCurrency: string): Promise<InvoiceLineItemInput[]>
        ↓
  [if GOOGLE_GENERATIVE_AI_API_KEY is set]
        ↓
  callGeminiStructuredOutput(text, schema)
        ↓
  validate against InvoiceLineItemInput[]
        ↓
  [on any error / missing key]
        ↓
  parseNaturalLanguageFallback(text)
        ↓
  return validated items (never throws to UI)
```

The invoice builder calls a single server action. It does not know whether AI or the fallback produced the result.

### AI input/output schema

**Input to AI** (server-side only):
- User's natural language text (trimmed, max 1000 chars)
- Business currency code (e.g., `"NGN"`)
- Strict system instruction: return ONLY valid JSON matching the schema

**Output schema** (enforced via Gemini `response_format`):

```json
{
  "items": [
    {
      "description": "string — service or product name",
      "quantity": "number — must be >= 1",
      "unit_price": "number — must be >= 0",
      "discount_amount": "number — optional, defaults to 0",
      "discount_type": "string — 'percentage' or 'fixed'",
      "tax_rate": "number — 0 to 100"
    }
  ]
}
```

**Server-side validation** (after AI returns):
- Every field checked against `InvoiceLineItemInput` type.
- `quantity > 0`
- `unit_price >= 0`
- `discount_amount >= 0`
- `discount_type` is `"percentage"` or `"fixed"`
- `tax_rate` between 0 and 100
- If any item fails validation → discard AI output, fall back to deterministic parser.
- If AI returns empty `items` or malformed JSON → fall back.

### AI security architecture

| Concern | Mitigation |
|---|---|
| API key exposure | Key stored in `GOOGLE_GENERATIVE_AI_API_KEY` (server-side env var). Never sent to browser. No `NEXT_PUBLIC_` prefix. |
| Prompt injection | System prompt instructs model to return ONLY valid JSON. No markdown, no instructions, no extra text. |
| Arbitrary database access | AI server action has no database write permissions. It only calls the Gemini API and returns parsed data. |
| Billing surprise | Free tier has no credit card requirement. Rate limits prevent runaway usage. No automatic retries that could exhaust quota. |
| Data sent to provider | Only the user's natural language prompt + minimal schema instructions. No customer IDs, no business IDs, no auth tokens, no invoice history. |
| Timeouts | 10-second timeout on AI call. Falls back to deterministic parser on timeout. |
| Rate limits | 429 errors caught and handled. User sees fallback result. No retry storms. |

### AI privacy considerations

- **What is sent to the AI provider**: Only the user's natural-language invoice request and the JSON schema instructions. No customer names, no customer IDs, no business IDs, no invoice history, no authentication tokens.
- **What is NOT sent**: Passwords, auth tokens, database IDs, unrelated invoice data, private business information beyond what the user typed.
- **Why this is safe**: The AI provider only receives the prompt text. Even if the prompt contains a customer name (e.g., "Invoice John for..."), that is the user's explicit input for parsing purposes — equivalent to typing it into any external tool.

### AI provider details (Google Gemini API)

**How to obtain an API key**:
1. Go to https://aistudio.google.com
2. Sign in with a Google account (no credit card required)
3. Create an API key
4. Add to `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY`

**Node.js SDK**:
- Package: `@google/genai`
- Compatible with Next.js server actions
- Supports `response_format` with JSON schema

**Rate limits (free tier)**:
- RPM: 10
- TPM: 250,000
- RPD: 1,500
- Context window: 1M tokens

**Failure modes**:
- 429 Rate limit → fallback to deterministic parser
- 401/403 Invalid key → fallback to deterministic parser
- Timeout (> 8s) → fallback to deterministic parser
- Malformed JSON response → validate, fallback if invalid
- Key not configured → skip AI, use deterministic parser directly

**Fallback UX**:
- If AI fails, the UI shows: "AI is temporarily unavailable. Showing best-effort parsing."
- Deterministic parser result is still presented for user review.
- No error blocks invoice creation.

### Deterministic parser (fallback)

Always available. No external dependency. Server-side regex/string parsing.

Patterns handled:
- `"Service name for [amount]"` → description, price
- `"Service name: [amount]"` → description, price
- `"[amount] for service"` → price, description
- `"plus [amount]"` → additional item
- `"and [amount]"` → additional item
- Comma-separated items
- Currency symbols: `₦`, `$`, `£`, `€`, `NGN`, `USD`, etc.
- Quantities: `"3 x Service"` or `"3 × ₦5000"` or `"3 at 5000 each"`

Output: structured `InvoiceLineItemInput[]` or empty array if no pattern matches.

### Server actions
New file: `app/actions/ai-invoice.ts`

```typescript
// Primary: tries AI if key is configured, falls back to deterministic
parseInvoiceFromText(text: string, businessCurrency: string): Promise<{ items: InvoiceLineItemInput[]; usedAI: boolean }>

// Deterministic fallback — always available
parseNaturalLanguage(text: string): Promise<InvoiceLineItemInput[]>
```

### Components
- `components/invoices/ai-quick-add.tsx` — textarea, generate button, preview of parsed items, Add to Invoice button.
- Integrated into `InvoiceBuilder`.

### Routes
- No new routes. Integrated into `/invoices/new` and `/invoices/[id]/edit`.

### Zero-cost strategy
- **What is free**: Google Gemini API free tier (no credit card, no expiration).
- **What has limits**: 10 RPM, 1,500 RPD — sufficient for MVP. Falls back gracefully when limits hit.
- **What could cost money**: If free tier ends or user exceeds limits → fallback to deterministic parser keeps the app working at zero cost.
- **MVP approach**: AI primary + deterministic fallback. Both produce the same normalized structure.

### Edge cases
- Empty input → no items, show "Enter a description to get started."
- No pattern matches → empty array, show "Couldn't parse that. Try: 'Website design ₦150,000 plus hosting ₦20,000'".
- Ambiguous input (multiple numbers) → best-effort extraction, user reviews.
- Extremely long input (> 1000 chars) → truncate before sending to AI.
- Malformed numbers → ignore or default to 0, show warning.
- User edits AI output → user has full control.
- User cancels → no side effects.
- AI unavailable → deterministic parser handles common cases; user sees same UI.

---

## 9. Zero-Cost Strategy Summary

| Feature | Uses Paid APIs? | Uses External Services? | Free Forever? |
|---|---|---|---|
| Reminders | No | No (clipboard + mailto/wa.me links) | Yes |
| Invoice Memory | No | No | Yes |
| Customer Intelligence | No | No | Yes |
| AI Quick Invoice | No (Google Gemini free tier) | No | Yes (with fallback) |

**Conclusion**: All PASS 9 features are implementable at zero capital cost. AI Quick Invoice uses Google Gemini's standing free tier (no credit card, no expiration). If the free tier becomes unavailable, the deterministic fallback ensures the feature continues working.

---

## 10. Database Changes

### Migration: `20240101000006_payment_reminders.sql`

```sql
-- Add last_reminded_at to invoices for reminder tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;

-- Index for potential reminder queries
CREATE INDEX IF NOT EXISTS idx_invoices_last_reminded ON invoices(last_reminded_at);
```

### Migration: `20240101000007_customer_intelligence.sql`

```sql
-- RPC: per-customer financial intelligence
CREATE OR REPLACE FUNCTION get_customer_intelligence(p_customer_id uuid)
RETURNS TABLE (
  total_invoiced numeric,
  total_paid numeric,
  total_outstanding numeric,
  total_overdue numeric,
  invoice_count bigint,
  paid_count bigint,
  outstanding_count bigint,
  overdue_count bigint,
  latest_invoice_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status NOT IN ('draft', 'cancelled') THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND due_date >= CURRENT_DATE THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN total ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN status = 'paid' THEN 1 END),
    COUNT(CASE WHEN status = 'sent' AND due_date >= CURRENT_DATE THEN 1 END),
    COUNT(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN 1 END),
    MAX(invoice_date)
  FROM invoices
  WHERE customer_id = p_customer_id
    AND business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE;
```

### Migration notes
- Both migrations are non-destructive.
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` is safe to re-run.
- The RPC uses `SECURITY INVOKER` (default), inheriting the caller's RLS policies.

---

## 11. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Enables AI-enhanced invoice parsing via Google Gemini API. If not set, deterministic parser is used automatically. |

**Setup instructions** (if user wants AI):
1. Go to https://aistudio.google.com
2. Sign in with Google account (no credit card required)
3. Create API key
4. Add to `.env.local`: `GOOGLE_GENERATIVE_AI_API_KEY=your-key-here`

**Important**: This key is server-side only. It must NOT be prefixed with `NEXT_PUBLIC_`.

---

## 12. Files to Create

| File | Purpose |
|---|---|
| `app/actions/reminders.ts` | Reminder text generation, reminder tracking |
| `app/actions/invoice-memory.ts` | Frequent service suggestions |
| `app/actions/customer-intelligence.ts` | Per-customer financial metrics, history, frequent services |
| `app/actions/ai-invoice.ts` | AI-enhanced parser (Gemini primary, deterministic fallback) |
| `components/invoices/invoice-reminder-dialog.tsx` | Reminder UI (email/WhatsApp) |
| `components/invoices/invoice-suggestions.tsx` | Memory suggestions in builder |
| `components/invoices/ai-quick-add.tsx` | AI Quick Add UI with preview |
| `components/customers/customer-intelligence.tsx` | Financial summary cards |
| `components/customers/customer-frequent-services.tsx` | Frequent services for customer |
| `components/customers/customer-invoice-history.tsx` | Invoice history list for customer |

---

## 13. Files to Modify

| File | Changes |
|---|---|
| `types/index.ts` | Add `CustomerIntelligence`, `InvoiceHistoryEntry`, `ServiceSuggestion` types |
| `package.json` | Add `@google/genai` dependency |
| `supabase/migrations/20240101000006_payment_reminders.sql` | New migration |
| `supabase/migrations/20240101000007_customer_intelligence.sql` | New migration |
| `app/invoices/[id]/page.tsx` | Fetch `last_reminded_at`, pass to preview |
| `components/invoices/invoice-preview.tsx` | Add Remind button + `InvoiceReminderDialog` |
| `components/invoices/invoice-builder.tsx` | Add `InvoiceSuggestions` section + `AiQuickAdd` section |
| `components/customers/customer-detail.tsx` | Add intelligence sections, populate invoice history |
| `app/customers/[id]/page.tsx` | Fetch additional customer data |

---

## 14. Server Actions Detail

### `app/actions/reminders.ts`

```typescript
generateReminderText(invoiceId: string): Promise<{ email: string; whatsapp: string } | null>
// Server-side text generation using business + customer + invoice data.
// Returns null if invoice not found or not in user's business.

recordReminderSent(invoiceId: string): Promise<{ success: true } | { error: string }>
// Updates invoices.last_reminded_at = NOW() for the invoice.
// Returns error if invoice not found or not in user's business.
```

### `app/actions/invoice-memory.ts`

```typescript
getFrequentServices(businessId: string, limit?: number): Promise<ServiceSuggestion[]>
getFrequentServicesForCustomer(businessId: string, customerId: string, limit?: number): Promise<ServiceSuggestion[]>
```

### `app/actions/customer-intelligence.ts`

```typescript
getCustomerIntelligence(customerId: string): Promise<CustomerIntelligence | null>
getCustomerInvoiceHistory(customerId: string): Promise<InvoiceHistoryEntry[]>
getCustomerFrequentServices(customerId: string, limit?: number): Promise<ServiceSuggestion[]>
```

### `app/actions/ai-invoice.ts`

```typescript
// Main entry point used by the UI. Tries AI first, falls back to deterministic parser.
parseInvoiceFromText(text: string, businessCurrency: string): Promise<{ items: InvoiceLineItemInput[]; usedAI: boolean }>

// Deterministic fallback — always available, no external dependency
parseNaturalLanguage(text: string): Promise<InvoiceLineItemInput[]>
```

---

## 15. UX Flow

### Reminders
1. User opens `/invoices/[id]` for a sent/overdue invoice.
2. Sees "Remind" button in the action bar (next to Edit/Share/Delete).
3. Clicks "Remind" → dialog opens.
4. Dialog shows two tabs/sections: "Email" and "WhatsApp".
5. Each section has formatted text + "Copy" button + "Open" button (mailto/wa.me).
6. User copies text, switches to email/WhatsApp, pastes and sends.
7. Invoice's `last_reminded_at` is updated when user clicks "Mark as reminded" or automatically on copy.

### Invoice Memory
1. User opens `/invoices/new` or edits `/invoices/[id]/edit`.
2. Selects a customer (or in edit mode, customer is pre-selected).
3. Above line items, sees "Suggestions" section loading.
4. Suggestions appear as pills: "Website Development (₦150,000)", "Monthly Hosting (₦20,000)".
5. Clicks a pill → new line item added with pre-filled values.
6. User can edit the item before saving.

### Customer Intelligence
1. User opens `/customers/[id]`.
2. Sees Financial Summary cards at the top: Total Invoiced, Paid, Outstanding, Overdue.
3. Below Contact Info: Frequently Purchased Services (pills).
4. Below that: Invoice History table/cards with links to each invoice.

### AI Quick Invoice
1. User opens `/invoices/new`.
2. Scrolls to "AI Quick Add" section (or it's at the top).
3. Types: `"Website development ₦150,000, hosting ₦20,000"`
4. Clicks "Generate" (explicit action, no auto-send).
5. System calls `parseInvoiceFromText`:
   - If `GOOGLE_GENERATIVE_AI_API_KEY` is set → calls Gemini with structured JSON schema.
   - If AI fails or key missing → deterministic parser handles it.
6. User sees preview:
   ```
   ✓ Website Development — ₦150,000 × 1
   ✓ Monthly Hosting — ₦20,000 × 1
   [Edit] [Add to Invoice] [Discard]
   ```
7. Clicks "Add to Invoice" → items appear in line items list.
8. User reviews and saves the invoice normally.

---

## 16. Responsive Strategy

- All new components follow existing mobile-first Tailwind patterns.
- Reminder dialog: full-screen on mobile, centered dialog on desktop (max-w-lg).
- Suggestions: horizontal scroll on mobile, wrap on desktop.
- Customer intelligence cards: same grid as dashboard stats (1 col mobile → 2 col tablet → 4 col desktop).
- Invoice history on customer page: card layout on mobile, table on desktop (same pattern as invoice list).
- AI Quick Add textarea: full width on all sizes.

---

## 17. Error States

| Feature | Error Scenario | Handling |
|---|---|---|
| Reminders | Invoice not found | Toast error, button disabled |
| Reminders | Clipboard unavailable | Toast error, show text in textarea for manual copy |
| Memory | Server action fails | Show empty state, no crash |
| Memory | No history | Empty state with helpful message |
| Customer Intelligence | Customer not found | Redirect to /customers |
| Customer Intelligence | Server action fails | Show zero metrics, toast warning |
| AI Quick Invoice | AI rate limit | Fallback to deterministic parser silently |
| AI Quick Invoice | AI timeout | Fallback to deterministic parser silently |
| AI Quick Invoice | AI returns invalid JSON | Validate, fallback to deterministic parser |
| AI Quick Invoice | Very long input | Truncate to 1000 chars before processing |
| AI Quick Invoice | No pattern matches (fallback) | Show "Couldn't parse" with example format |

---

## 18. Loading States

- **Reminders**: Button shows spinner while generating text.
- **Memory**: Skeleton pills or "Loading suggestions..." text while fetching.
- **Customer Intelligence**: Existing skeleton on customer detail page is sufficient for the new sections.
- **AI Quick Invoice**: "Generating..." text while processing. Explicit button click — no auto-parse on keystroke.

---

## 19. Performance Considerations

- **Memory queries**: Simple GROUP BY on `invoice_items` + `invoices`. Acceptable for MVP datasets (< 10k invoices). Add index on `invoice_items.description` if needed.
- **Customer intelligence RPC**: Single aggregate query, no row downloads. O(1) regardless of invoice count.
- **Invoice history for customer**: For MVP, fetch all (most customers have < 100 invoices). Add pagination in PASS 10 if needed.
- **AI parsing**: Server-side call with 10-second timeout. No client-side waiting. Falls back silently on failure.

---

## 20. Manual Testing Matrix

### Customer Intelligence
- [ ] Customer with no invoices → shows zeros, empty history, no frequent services
- [ ] Customer with 1 paid invoice → correct totals, 1 in history
- [ ] Customer with mixed statuses (draft, sent, paid, overdue) → correct breakdown
- [ ] Outstanding calculation excludes overdue
- [ ] Overdue calculation only counts sent + past due
- [ ] Unauthorized customer access → null/redirect
- [ ] Cross-business customer ID → blocked by RLS + server action scoping
- [ ] Frequent services show correct count and latest price

### Invoice Memory
- [ ] No history → empty suggestions
- [ ] 1 previous service → 1 suggestion
- [ ] Repeated service → higher usage count
- [ ] Different prices for same service → shows latest price
- [ ] Customer-specific suggestions differ from business-wide
- [ ] Clicking suggestion adds item without overwriting existing items
- [ ] Edit mode: suggestions still appear

### Reminders
- [ ] Draft invoice → no Remind button
- [ ] Sent invoice → Remind button visible
- [ ] Overdue invoice → Remind button visible
- [ ] Paid invoice → no Remind button
- [ ] Cancelled invoice → no Remind button
- [ ] Reminder text contains correct customer name, invoice number, amount, due date
- [ ] Email text copy works
- [ ] WhatsApp text copy works
- [ ] Customer has no phone → WhatsApp option hidden
- [ ] Copy updates `last_reminded_at`
- [ ] Mobile: dialog usable at 375px

### AI Quick Invoice
- [ ] Simple input: "Website design ₦150,000" → 1 item (AI or fallback)
- [ ] Multiple items: "Web ₦150k, hosting ₦20k" → 2 items
- [ ] Quantity: "3 pages at 5000 each" → qty=3, price=5000
- [ ] Ambiguous input → best-effort, user can edit
- [ ] No numbers → empty array, helpful message
- [ ] Empty input → no crash
- [ ] User edits parsed output before adding
- [ ] Adding to invoice doesn't auto-save
- [ ] Long input (1000+ chars) → handled gracefully
- [ ] AI key missing → deterministic fallback works
- [ ] AI rate limited → deterministic fallback works
- [ ] AI returns invalid JSON → deterministic fallback works

### Security
- [ ] Manipulated customer ID → blocked by server action
- [ ] Manipulated invoice ID → blocked
- [ ] Cross-business data access → blocked by RLS
- [ ] AI output validated (no negative prices, no injection)
- [ ] API key not exposed to browser

### Responsive
- [ ] 375px: all new UI usable, no horizontal overflow
- [ ] 390px: same
- [ ] 414px: same
- [ ] 768px: layout adapts
- [ ] 1024px: desktop layout
- [ ] 1440px: wide layout

---

## 21. Acceptance Criteria

PASS 9 is complete when:

1. **Reminders**: Invoice detail page has a "Remind" button for sent/overdue invoices that generates contextual email and WhatsApp text with copy and deep-link actions.
2. **Invoice Memory**: Invoice builder shows relevant service suggestions based on customer and business history.
3. **Customer Intelligence**: Customer detail page shows financial summary, frequent services, and actual invoice history.
4. **AI Quick Invoice**: Invoice builder has an AI-powered natural language parser (Google Gemini free tier) that converts natural language into structured invoice line items for user review, with a deterministic fallback if AI is unavailable.
5. **Zero capital**: No paid APIs, no paid services. AI uses Google Gemini standing free tier.
6. **Security**: All new server actions respect business ownership and RLS. No client-supplied IDs trusted. AI API key never exposed.
7. **UX consistency**: All new components use existing design system, Tailwind conventions, icons, and responsive patterns.
8. **Validation**: `npm run lint` passes, `npm run build` passes.
9. **No broken existing features**: Invoice CRUD, customer CRUD, dashboard, PDF, print, share all continue working.

---

## 22. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Deterministic parser fails on complex inputs | Medium | Low | User sees empty result with example format; AI fallback handles more cases |
| Memory suggestions irrelevant for new businesses | High (expected) | Low | Show empty state with encouraging message |
| Customer intelligence query slow on large datasets | Low | Medium | Add index if needed; RPC is O(1) aggregate |
| `last_reminded_at` column conflicts with future reminder table | Low | Low | Column is simple; future table can reference or ignore it |
| AI provider changes free tier terms | Low | Medium | Abstraction layer allows swapping provider; deterministic fallback remains |
| Clipboard API unavailable on some browsers | Low | Low | Show text in textarea for manual copy |
| Gemini rate limits hit during heavy usage | Low | Low | Fallback to deterministic parser; user sees same UI |

---

## 23. What is Explicitly Deferred

| Feature | Reason |
|---|---|
| Automated email/SMS/WhatsApp sending | Requires paid provider (Resend, Twilio). Out of scope for zero-capital MVP. |
| Reminder scheduling/automation | Requires cron/background workers (paid on Vercel). Manual reminder assistance is the MVP. |
| Reminder templates configuration | Hardcoded templates are sufficient for MVP. Customization is a v2 feature. |
| Public invoice sharing routes | Deferred to PASS 10 per roadmap. |
| Payment integration | Never — Remitovate does not process payments. |
| Invoice memory persistence table | Existing `invoice_items` data is sufficient. Dedicated table is over-engineering for MVP. |
| Customer intelligence RPC for frequent services | Server action query is sufficient. RPC can be added later if needed. |
| Additional AI providers (Groq, OpenRouter, etc.) | Abstraction layer allows adding later. Gemini is the MVP choice. |

---

## 24. Expected Files to Create/Modify (Complete List)

### Create (10 files)
1. `app/actions/reminders.ts`
2. `app/actions/invoice-memory.ts`
3. `app/actions/customer-intelligence.ts`
4. `app/actions/ai-invoice.ts`
5. `components/invoices/invoice-reminder-dialog.tsx`
6. `components/invoices/invoice-suggestions.tsx`
7. `components/invoices/ai-quick-add.tsx`
8. `components/customers/customer-intelligence.tsx`
9. `components/customers/customer-frequent-services.tsx`
10. `components/customers/customer-invoice-history.tsx`

### Modify (9 files)
1. `types/index.ts` — add new types
2. `package.json` — add `@google/genai`
3. `supabase/migrations/20240101000006_payment_reminders.sql` — new migration
4. `supabase/migrations/20240101000007_customer_intelligence.sql` — new migration
5. `app/invoices/[id]/page.tsx` — fetch `last_reminded_at`
6. `components/invoices/invoice-preview.tsx` — add Remind button + dialog
7. `components/invoices/invoice-builder.tsx` — add suggestions + AI Quick Add sections
8. `components/customers/customer-detail.tsx` — add intelligence sections
9. `app/customers/[id]/page.tsx` — fetch additional data

---

## 25. Migration Plan

1. Apply `20240101000006_payment_reminders.sql` — adds `last_reminded_at` column.
2. Apply `20240101000007_customer_intelligence.sql` — adds `get_customer_intelligence` RPC.
3. Both migrations use `IF NOT EXISTS` / `DROP IF EXISTS` patterns for idempotency.
4. No data migration or backfill required.
5. Test on a staging/dev Supabase project before production.

---

## 26. Dependencies

**New dependency:**

| Package | Version | Purpose |
|---|---|---|
| `@google/genai` | ^1.0.0 | Google Gemini API client for AI-enhanced invoice parsing |

All other features use existing dependencies:
- React/Next.js patterns
- Tailwind CSS
- Lucide icons
- Supabase client
- Server actions architecture

---

## 27. Implementation Order

Recommended implementation sequence (smallest clean steps):

1. **Migration 6** — `last_reminded_at` column
2. **Migration 7** — `get_customer_intelligence` RPC
3. **`app/actions/customer-intelligence.ts`** — customer metrics + history + frequent services
4. **`components/customers/customer-intelligence.tsx`** — financial summary cards
5. **`components/customers/customer-frequent-services.tsx`** — frequent services pills
6. **`components/customers/customer-invoice-history.tsx`** — invoice history list
7. **Update `customer-detail.tsx`** — integrate new sections
8. **Update `app/customers/[id]/page.tsx`** — fetch additional data
9. **`app/actions/reminders.ts`** — reminder text generation + tracking
10. **`components/invoices/invoice-reminder-dialog.tsx`** — reminder UI
11. **Update `invoice-preview.tsx`** — add Remind button + dialog
12. **`app/actions/invoice-memory.ts`** — frequent services queries
13. **`components/invoices/invoice-suggestions.tsx`** — suggestion pills
14. **Update `invoice-builder.tsx`** — integrate suggestions
15. **`app/actions/ai-invoice.ts`** — AI parser abstraction + deterministic fallback
16. **`components/invoices/ai-quick-add.tsx`** — AI Quick Add UI
17. **Update `package.json`** — add `@google/genai`
18. **Update `types/index.ts`** — new types
19. **Validation**: `npm run lint`, `npm run build`

---

## 28. Remaining Issues / Notes

1. **Onboarding selects**: Known technical debt (native `<select>` in dark mode). Not related to PASS 9 — deferred.
2. **`getInvoices` and `getRecentInvoices` duplication**: Not related to PASS 9 — deferred.
3. **`next_invoice_number` not updated on settings change**: Pre-existing limitation — deferred.
4. **No automated tests**: Deferred to PASS 10.
5. **Gemini free tier sustainability**: Google has maintained the Gemini free tier since launch. If terms change, the deterministic fallback ensures zero-cost operation continues.
