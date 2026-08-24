import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessForm } from "@/components/settings/business-form";
import { getBusinessForInvoice } from "@/app/actions/invoices";
import { getSignedLogoUrl } from "@/app/actions/upload";

function BusinessFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
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
      </div>
    </div>
  );
}

async function SettingsContent() {
  const business = await getBusinessForInvoice();

  if (!business) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No business found. Please complete onboarding.
      </div>
    );
  }

  const logoUrl = business.logo_url
    ? await getSignedLogoUrl(business.logo_url)
    : null;

  return <BusinessForm business={business} logoUrl={logoUrl} />;
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<BusinessFormSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
