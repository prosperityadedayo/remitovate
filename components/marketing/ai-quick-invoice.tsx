import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const naturalLanguage = `"I designed Sarah's website for ₦150,000 and added hosting for ₦20,000."`;

const lineItems = [
  { description: "Website Design", amount: "₦150,000" },
  { description: "Hosting Setup", amount: "₦20,000" },
];

export function AIQuickInvoice() {
  return (
    <section id="ai-invoice" className="py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI Quick Invoice
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Describe the work. Remitovate builds the invoice.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Soon you will be able to describe work in plain language and
              Remitovate will convert it into structured invoice line items
              automatically.
            </p>
            <div className="mt-8">
              <Button asChild>
                <Link href="/auth/sign-up">Create your account</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Natural language
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {naturalLanguage}
              </p>
              <div className="mt-4 flex items-center justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Structured invoice
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {item.description}
                    </span>
                    <span className="font-medium text-foreground">
                      {item.amount}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    <span>Total</span>
                    <span>₦170,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
