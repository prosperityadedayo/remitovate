"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Sparkles } from "lucide-react";
import { ServiceSuggestion } from "@/types";

interface InvoiceSuggestionsProps {
  customerId?: string;
  businessId: string;
  onSelect: (suggestion: ServiceSuggestion) => void;
}

export function InvoiceSuggestions({
  customerId,
  businessId,
  onSelect,
}: InvoiceSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSuggestions() {
      setLoading(true);
      try {
        const { getFrequentServices, getFrequentServicesForCustomer } = await import(
          "@/app/actions/invoice-memory"
        );

        let results: ServiceSuggestion[] = [];

        if (customerId) {
          results = await getFrequentServicesForCustomer(businessId, customerId, 5);
        }

        if (results.length === 0) {
          results = await getFrequentServices(businessId, 5);
        }

        if (mounted) {
          setSuggestions(results);
        }
      } catch {
        if (mounted) {
          setSuggestions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSuggestions();

    return () => {
      mounted = false;
    };
  }, [businessId, customerId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Suggestions
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-40 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Suggestions
        </div>
        <p className="text-xs text-muted-foreground">
          No suggestions yet. Create more invoices to see frequent services here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        Suggestions
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.description}
            variant="outline"
            size="sm"
            className="h-8 rounded-full text-xs"
            onClick={() => onSelect(suggestion)}
          >
            <Plus className="mr-1 h-3 w-3" />
            {suggestion.description}
            {suggestion.latestUnitPrice > 0 && (
              <span className="ml-1 text-muted-foreground">
                ({suggestion.latestUnitPrice.toLocaleString()})
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
