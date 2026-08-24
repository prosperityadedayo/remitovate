"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { InvoiceWithItems } from "@/types";
import { Building2, User, Calendar, FileText, ArrowLeft, Edit } from "lucide-react";
import { formatCurrency, formatDate, getEffectiveStatus } from "@/lib/invoice-utils";
import { InvoiceStatusActions } from "./invoice-status-actions";
import { InvoiceDeleteButton } from "./invoice-delete-button";
import { InvoiceStatusBadge } from "./invoice-status-badge";

interface InvoicePreviewProps {
  invoice: InvoiceWithItems;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const currency = invoice.businesses.currency || "NGN";
  const effectiveStatus = getEffectiveStatus(invoice.status, invoice.due_date);
  const isEditable = effectiveStatus !== "paid" && effectiveStatus !== "cancelled";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Invoices
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isEditable && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          <InvoiceStatusActions
            invoiceId={invoice.id}
            status={invoice.status}
            dueDate={invoice.due_date}
          />
          <InvoiceDeleteButton
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">
                {invoice.businesses.name}
              </CardTitle>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {invoice.businesses.email && (
                  <p>{invoice.businesses.email}</p>
                )}
                {invoice.businesses.phone && (
                  <p>{invoice.businesses.phone}</p>
                )}
                {invoice.businesses.address && (
                  <p>{invoice.businesses.address}</p>
                )}
                {invoice.businesses.country && (
                  <p>{invoice.businesses.country}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                Invoice #{invoice.invoice_number}
              </div>
              <div className="mt-2">
                <InvoiceStatusBadge
                  status={invoice.status}
                  dueDate={invoice.due_date}
                  showIcon={true}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <User className="h-3 w-3" />
                Bill To
              </div>
              <p className="font-medium">{invoice.customers.name}</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                {invoice.customers.email && <p>{invoice.customers.email}</p>}
                {invoice.customers.phone && <p>{invoice.customers.phone}</p>}
                {invoice.customers.address && (
                  <p>{invoice.customers.address}</p>
                )}
                {invoice.customers.country && (
                  <p>{invoice.customers.country}</p>
                )}
              </div>
            </div>
            <div className="space-y-1 md:text-right">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground md:justify-end">
                <Calendar className="h-3 w-3" />
                Dates
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4 md:justify-end">
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span className="font-medium">
                    {formatDate(invoice.invoice_date)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 md:justify-end">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 pr-4 text-right">Qty</th>
                  <th className="pb-2 pr-4 text-right">Price</th>
                  <th className="pb-2 pr-4 text-right">Discount</th>
                  <th className="pb-2 pr-4 text-right">Tax</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4">{item.description}</td>
                    <td className="py-3 pr-4 text-right">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {formatCurrency(item.unit_price, currency)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {formatCurrency(item.discount_amount, currency)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {item.tax_rate.toLocaleString()}%
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(item.total, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 sm:ml-auto sm:w-72">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(invoice.subtotal, currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium">
                {formatCurrency(invoice.discount_amount, currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">
                {formatCurrency(invoice.tax_amount, currency)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, currency)}</span>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Notes
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            </>
          )}

          {invoice.payment_information && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  Payment Information
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.payment_information}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
