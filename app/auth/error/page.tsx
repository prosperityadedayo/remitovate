import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

function getFriendlyMessage(error?: string) {
  if (!error) return "An unspecified error occurred. Please try again.";

  const lower = error.toLowerCase();
  if (lower.includes("token") || lower.includes("otp")) {
    return "The verification link is invalid or has expired. Please try again.";
  }
  if (lower.includes("no token hash")) {
    return "The verification link is missing required information.";
  }
  return "Something went wrong. Please try again or contact support.";
}

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <p className="text-sm text-muted-foreground">
      {getFriendlyMessage(params?.error)}
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
