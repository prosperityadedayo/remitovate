"use client";

import { InvoiceWithItems } from "@/types";
import { formatCurrency, formatDate } from "@/lib/invoice-utils";
import Image from "next/image";

interface InvoiceDocumentProps {
  invoice: InvoiceWithItems;
  logoUrl: string | null;
}

export function InvoiceDocument({ invoice, logoUrl }: InvoiceDocumentProps) {
  const currency = invoice.businesses.currency || "NGN";
  const brandColour = invoice.businesses.brand_colour || "#4F46E5";

  return (
    <div className="invoice-document mx-auto w-full max-w-[210mm] bg-background text-foreground">
      <div
        className="border-b-4 pb-6"
        style={{ borderColor: brandColour }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={invoice.businesses.name}
                width={80}
                height={80}
                className="h-16 w-16 rounded-md object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-dashed border-border bg-muted">
                <span className="text-xs text-muted-foreground">Logo</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {invoice.businesses.name}
              </h1>
              <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                {invoice.businesses.email && <p>{invoice.businesses.email}</p>}
                {invoice.businesses.phone && <p>{invoice.businesses.phone}</p>}
                {invoice.businesses.address && <p>{invoice.businesses.address}</p>}
                {invoice.businesses.country && <p>{invoice.businesses.country}</p>}
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xl font-semibold text-foreground">
              Invoice #{invoice.invoice_number}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <div className="flex justify-between gap-4 sm:justify-end">
                <span>Date:</span>
                <span className="font-medium text-foreground">{formatDate(invoice.invoice_date)}</span>
              </div>
              <div className="flex justify-between gap-4 sm:justify-end">
                <span>Due:</span>
                <span className="font-medium text-foreground">{formatDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 py-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bill To
          </h2>
          <p className="font-semibold text-foreground">{invoice.customers.name}</p>
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {invoice.customers.email && <p>{invoice.customers.email}</p>}
            {invoice.customers.phone && <p>{invoice.customers.phone}</p>}
            {invoice.customers.address && <p>{invoice.customers.address}</p>}
            {invoice.customers.country && <p>{invoice.customers.country}</p>}
          </div>
        </div>
        <div className="md:text-right">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Invoice Details
          </h2>
          <div className="space-y-0.5 text-sm">
            <div className="flex justify-between gap-4 md:justify-end">
              <span className="text-muted-foreground">Invoice Number:</span>
              <span className="font-medium text-foreground">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between gap-4 md:justify-end">
              <span className="text-muted-foreground">Invoice Date:</span>
              <span className="font-medium text-foreground">{formatDate(invoice.invoice_date)}</span>
            </div>
            <div className="flex justify-between gap-4 md:justify-end">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-medium text-foreground">{formatDate(invoice.due_date)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 pr-4 text-right font-medium">Qty</th>
                <th className="pb-2 pr-4 text-right font-medium">Price</th>
                <th className="pb-2 pr-4 text-right font-medium">Discount</th>
                <th className="pb-2 pr-4 text-right font-medium">Tax</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 text-foreground">{item.description}</td>
                  <td className="py-3 pr-4 text-right text-muted-foreground">
                    {item.quantity.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right text-muted-foreground">
                    {formatCurrency(item.unit_price, currency)}
                  </td>
                  <td className="py-3 pr-4 text-right text-muted-foreground">
                    {formatCurrency(item.discount_amount, currency)}
                  </td>
                  <td className="py-3 pr-4 text-right text-muted-foreground">
                    {item.tax_rate.toLocaleString()}%
                  </td>
                  <td className="py-3 text-right font-medium text-foreground">
                    {formatCurrency(item.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:ml-auto sm:w-72">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">
            {formatCurrency(invoice.subtotal, currency)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="font-medium text-foreground">
            {formatCurrency(invoice.discount_amount, currency)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span className="font-medium text-foreground">
            {formatCurrency(invoice.tax_amount, currency)}
          </span>
        </div>
        <div
          className="border-t-2 pt-2"
          style={{ borderColor: brandColour }}
        >
          <div className="flex justify-between text-base font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{formatCurrency(invoice.total, currency)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {invoice.notes}
          </p>
        </div>
      )}

      {invoice.payment_information && (
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Information
          </h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {invoice.payment_information}
          </p>
        </div>
      )}
    </div>
  );
}
