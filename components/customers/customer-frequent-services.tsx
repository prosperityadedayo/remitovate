"use client";

import { Button } from "@/components/ui/button";
import { ServiceSuggestion } from "@/types";
import { Plus } from "lucide-react";

interface CustomerFrequentServicesProps {
  services: ServiceSuggestion[];
  onSelect?: (service: ServiceSuggestion) => void;
}

export function CustomerFrequentServices({
  services,
  onSelect,
}: CustomerFrequentServicesProps) {
  if (services.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Frequently Purchased Services
        </h3>
        <p className="text-sm text-muted-foreground">
          No services purchased yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Frequently Purchased Services
      </h3>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => (
          <Button
            key={service.description}
            variant="outline"
            size="sm"
            className="h-8 rounded-full text-xs"
            onClick={() => onSelect?.(service)}
          >
            <Plus className="mr-1 h-3 w-3" />
            {service.description}
            {service.latestUnitPrice > 0 && (
              <span className="ml-1 text-muted-foreground">
                ({service.latestUnitPrice.toLocaleString()})
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
