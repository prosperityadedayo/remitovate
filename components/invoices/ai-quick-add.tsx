"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { InvoiceLineItemInput } from "@/types";
import { parseInvoiceFromText } from "@/app/actions/ai-invoice";

interface AiQuickAddProps {
  onAddItems: (items: InvoiceLineItemInput[]) => void;
}

export function AiQuickAdd({ onAddItems }: AiQuickAddProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<InvoiceLineItemInput[] | null>(null);
  const [usedAI, setUsedAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setParsedItems(null);

    try {
      const result = await parseInvoiceFromText(text.trim());
      setParsedItems(result.items);
      setUsedAI(result.usedAI);

      if (result.items.length === 0) {
        setError(
          "Couldn't parse any line items from that text. Try: 'Website design ₦150,000 plus hosting ₦20,000'",
        );
      }
    } catch {
      setError("Something went wrong. Please try again or add items manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToInvoice = () => {
    if (parsedItems && parsedItems.length > 0) {
      onAddItems(parsedItems);
      setText("");
      setParsedItems(null);
      setUsedAI(false);
      setError(null);
    }
  };

  const handleDiscard = () => {
    setParsedItems(null);
    setUsedAI(false);
    setError(null);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Quick Add</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Describe what you want to invoice in plain English. For example:
          &quot;Website development ₦150,000, hosting ₦20,000&quot;
        </p>

        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder="Website design for Sarah, 3 pages at ₦50,000 each..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={loading}
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Invoice Items
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {parsedItems && parsedItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Generated items
                {usedAI && (
                  <span className="ml-2 text-xs text-muted-foreground">(AI)</span>
                )}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="h-8 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Discard
              </Button>
            </div>

            <div className="space-y-2">
              {parsedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × {item.unit_price.toLocaleString()}
                      {item.discount_amount > 0 && (
                        <span className="ml-2">
                          (Discount: {item.discount_amount}
                          {item.discount_type === "percentage" ? "%" : ""})
                        </span>
                      )}
                      {item.tax_rate > 0 && (
                        <span className="ml-2">(Tax: {item.tax_rate}%)</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleAddToInvoice}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Invoice
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
