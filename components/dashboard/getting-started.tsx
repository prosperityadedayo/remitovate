"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, FileText, CheckCircle2, Circle } from "lucide-react";

interface SetupStatus {
  hasProfile: boolean;
  hasCustomers: boolean;
  hasInvoices: boolean;
}

interface GettingStartedProps {
  setupStatus: SetupStatus;
  loading?: boolean;
}

function CheckItem({
  complete,
  label,
  description,
  href,
  icon: Icon,
}: {
  complete: boolean;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
          complete
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {complete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {!complete && (
          <Button asChild variant="link" className="h-auto p-0 mt-1 text-xs">
            <Link href={href}>
              <Icon className="mr-1 h-3 w-3" />
              {label === "Add your first customer" ? "Add Customer" : "Create Invoice"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function GettingStarted({ setupStatus, loading }: GettingStartedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CheckItem
          complete={setupStatus.hasProfile}
          label="Complete your business profile"
          description="Set up your business details and branding"
          href="/dashboard/onboarding"
          icon={FileText}
        />
        <CheckItem
          complete={setupStatus.hasCustomers}
          label="Add your first customer"
          description="Customers make invoicing faster"
          href="/customers"
          icon={Users}
        />
        <CheckItem
          complete={setupStatus.hasInvoices}
          label="Create your first invoice"
          description="Send professional invoices in seconds"
          href="/invoices"
          icon={FileText}
        />
      </CardContent>
    </Card>
  );
}
