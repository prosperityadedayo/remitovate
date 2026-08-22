import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";
import { getCustomersForInvoice, getBusinessForInvoice } from "@/app/actions/invoices";

function InvoiceBuilderSkeleton() {
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

async function InvoiceBuilderContent() {
  const [customers, business] = await Promise.all([
    getCustomersForInvoice(),
    getBusinessForInvoice(),
  ]);

  if (!business) {
    redirect("/dashboard/onboarding");
  }

  return <InvoiceBuilder customers={customers} business={business} />;
}

export default async function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<InvoiceBuilderSkeleton />}>
        <InvoiceBuilderContent />
      </Suspense>
    </div>
  );
}
