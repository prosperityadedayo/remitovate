"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { RecentInvoice } from "@/types";

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "paid":
      return "default";
    case "sent":
      return "secondary";
    case "overdue":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "paid":
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case "sent":
      return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case "overdue":
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

interface InvoiceListProps {
  invoices: RecentInvoice[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Invoices
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your invoices and track payments.
            </p>
          </div>
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 text-lg font-medium">No invoices yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first invoice to start tracking payments.
            </p>
            <Button asChild className="mt-4">
              <Link href="/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="mt-1 text-muted-foreground">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} total
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => (
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
                      {invoice.invoice_number}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {invoice.customer_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(invoice.total, "NGN")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(invoice.due_date)}
                  </p>
                </div>
                <Badge variant={getStatusVariant(invoice.status)}>
                  {getStatusIcon(invoice.status)}
                  <span className="ml-1">{invoice.status}</span>
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
