import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function UserCheck() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back, {user.email}.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              The full dashboard experience is coming in the next pass. This
              placeholder confirms your authentication is working correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-2xl">
            <div className="flex flex-col gap-6">
              <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
              <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      }
    >
      <UserCheck />
    </Suspense>
  );
}
