"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { InvoiceHistoryEntry } from "@/types";
import { FileText } from "lucide-react";
import {
  formatCurrency,
  formatDateShort,
  getEffectiveStatus,
  getStatusVariant,
} from "@/lib/invoice-utils";

interface CustomerInvoiceHistoryProps {
  invoices: InvoiceHistoryEntry[];
  currency: string;
}

export function CustomerInvoiceHistory({
  invoices,
  currency,
}: CustomerInvoiceHistoryProps) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No invoices for this customer yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const effectiveStatus = getEffectiveStatus(
              invoice.status,
              invoice.dueDate,
            );
            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="group block"
              >
                <div className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:underline">
                          {invoice.invoiceNumber}
                        </p>
                        <Badge
                          variant={getStatusVariant(effectiveStatus)}
                          className="capitalize"
                        >
                          {effectiveStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        Due {formatDateShort(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(invoice.total, currency, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(invoice.invoiceDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerInvoiceHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
