import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerById } from "@/app/actions/customers";
import {
  getCustomerIntelligence,
  getCustomerInvoiceHistory,
  getCustomerFrequentServices,
} from "@/app/actions/customer-intelligence";
import { createClient } from "@/lib/supabase/server";

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

async function CustomerDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("currency")
    .eq("id", customer.business_id)
    .maybeSingle();

  const currency = business?.currency || "NGN";

  const [intelligence, invoiceHistory, frequentServices] = await Promise.all([
    getCustomerIntelligence(id),
    getCustomerInvoiceHistory(id),
    getCustomerFrequentServices(id, 5),
  ]);

  return (
    <CustomerDetail
      customer={customer}
      intelligence={intelligence}
      invoiceHistory={invoiceHistory}
      frequentServices={frequentServices}
      currency={currency}
    />
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<CustomerDetailSkeleton />}>
        <CustomerDetailContent params={params} />
      </Suspense>
    </div>
  );
}
