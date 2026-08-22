import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { getInvoiceById } from "@/app/actions/invoices";

function InvoicePreviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-6 w-32 ml-auto" />
              <Skeleton className="h-5 w-16 ml-auto" />
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-5 w-32 ml-auto" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-6 w-32 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function InvoicePreviewContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return <InvoicePreview invoice={invoice} />;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<InvoicePreviewSkeleton />}>
        <InvoicePreviewContent params={params} />
      </Suspense>
    </div>
  );
}
