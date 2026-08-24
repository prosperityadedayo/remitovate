import { Suspense } from "react";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvoices } from "@/app/actions/invoices";
import { getBusinessId } from "@/app/actions/dashboard";

function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
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
            <div className="flex items-center gap-4 justify-end">
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function InvoicesContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; order?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "all";

  let sortBy: "invoice_date" | "due_date" | "total" | "created_at" | undefined;
  let sortOrder: "asc" | "desc" | undefined;

  if (params.sort && params.order) {
    const validSortFields = [
      "invoice_date",
      "due_date",
      "total",
      "created_at",
    ] as const;
    if (validSortFields.includes(params.sort as (typeof validSortFields)[number])) {
      sortBy = params.sort as (typeof validSortFields)[number];
      sortOrder = params.order === "asc" ? "asc" : "desc";
    }
  }

  const [invoices, business] = await Promise.all([
    getInvoices({
      searchQuery: query,
      statusFilter,
      sortBy,
      sortOrder,
    }),
    getBusinessId(),
  ]);

  const sortValue =
    params.sort && params.order
      ? `${params.sort}_${params.order}`
      : "created_desc";

  return (
    <InvoiceList
      invoices={invoices}
      currency={business?.currency || "NGN"}
      searchQuery={query}
      statusFilter={statusFilter}
      sortValue={sortValue}
    />
  );
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; order?: string }>;
}) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<InvoicesSkeleton />}>
        <InvoicesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
