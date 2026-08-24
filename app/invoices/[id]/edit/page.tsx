import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";
import {
  getCustomersForInvoice,
  getBusinessForInvoice,
  getInvoiceById,
} from "@/app/actions/invoices";
import { getEffectiveStatus } from "@/lib/invoice-utils";

function InvoiceEditSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border border-border p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="rounded-lg border border-border p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function InvoiceEditContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customers, business, invoice] = await Promise.all([
    getCustomersForInvoice(),
    getBusinessForInvoice(),
    getInvoiceById(id),
  ]);

  if (!business) {
    redirect("/dashboard/onboarding");
  }

  if (!invoice) {
    notFound();
  }

  const effectiveStatus = getEffectiveStatus(invoice.status, invoice.due_date);
  if (effectiveStatus === "paid" || effectiveStatus === "cancelled") {
    redirect(`/invoices/${id}`);
  }

  return (
    <InvoiceBuilder
      customers={customers}
      business={business}
      mode="edit"
      invoice={invoice}
      invoiceId={id}
    />
  );
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<InvoiceEditSkeleton />}>
        <InvoiceEditContent params={params} />
      </Suspense>
    </div>
  );
}
