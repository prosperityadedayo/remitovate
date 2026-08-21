import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { GettingStarted } from "@/components/dashboard/getting-started";
import { getDashboardStats, getRecentInvoices, getBusinessSetupStatus, getBusinessId } from "@/app/actions/dashboard";

async function DashboardGate() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/dashboard/onboarding");
  }

  return null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

async function WelcomeHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  let businessName = "your business";

  if (user) {
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (business?.name) {
      businessName = business.name;
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {getGreeting()}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Here&apos;s what&apos;s happening with{" "}
        <span className="font-medium text-foreground">{businessName}</span>.
      </p>
    </div>
  );
}

async function SetupIndicator() {
  const setupStatus = await getBusinessSetupStatus();

  if (setupStatus.hasProfile && setupStatus.hasCustomers && setupStatus.hasInvoices) {
    return null;
  }

  const missing = [];
  if (!setupStatus.hasProfile) missing.push("business profile");
  if (!setupStatus.hasCustomers) missing.push("first customer");
  if (!setupStatus.hasInvoices) missing.push("first invoice");

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Building2 className="h-4 w-4 text-primary" />
      <AlertDescription className="text-sm">
        <span className="font-medium">Setup in progress:</span>{" "}
        Complete your {missing.join(", ")} to get the most out of Remitovate.
      </AlertDescription>
    </Alert>
  );
}

async function DashboardStatsSection() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Total Invoiced",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: stats.currency || "NGN",
        maximumFractionDigits: 0,
      }).format(stats.totalInvoiced),
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Paid",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: stats.currency || "NGN",
        maximumFractionDigits: 0,
      }).format(stats.paid),
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Outstanding",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: stats.currency || "NGN",
        maximumFractionDigits: 0,
      }).format(stats.outstanding),
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Overdue",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: stats.currency || "NGN",
        maximumFractionDigits: 0,
      }).format(stats.overdue),
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
}

async function RecentInvoicesSection() {
  const [recentInvoices, business] = await Promise.all([
    getRecentInvoices(),
    getBusinessId(),
  ]);

  return (
    <RecentInvoices
      invoices={recentInvoices}
      currency={business?.currency || "NGN"}
      loading={false}
    />
  );
}

function QuickActions() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-3">
          <a
            href="/invoices"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">New Invoice</p>
              <p className="text-xs text-muted-foreground">Create and send an invoice</p>
            </div>
          </a>
          <a
            href="/customers"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Add Customer</p>
              <p className="text-xs text-muted-foreground">Add a new customer</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardGate />
      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-96" />
            </div>
          }
        >
          <WelcomeHeader />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
          }
        >
          <SetupIndicator />
        </Suspense>

        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          }
        >
          <DashboardStatsSection />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense
              fallback={
                <div className="h-96 animate-pulse rounded-xl bg-muted" />
              }
            >
              <RecentInvoicesSection />
            </Suspense>
          </div>

          <div className="space-y-6">
            <QuickActions />

            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded-xl bg-muted" />
              }
            >
              <GettingStartedWrapper />
            </Suspense>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

async function GettingStartedWrapper() {
  const setupStatus = await getBusinessSetupStatus();
  return <GettingStarted setupStatus={setupStatus} />;
}
