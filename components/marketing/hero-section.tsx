import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoicePreview } from "@/components/marketing/invoice-preview";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Invoicing, without the repetition.
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Create professional invoices in seconds.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Set up your business once, save your branding and preferences, and
              create polished invoices without repeatedly entering the same
              information.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Create your account</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <InvoicePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
