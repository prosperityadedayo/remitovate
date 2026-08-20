export function MobileSection() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <div className="mx-auto w-full max-w-[280px]">
              <div className="rounded-[2rem] border border-border bg-background p-3 shadow-xl">
                <div className="rounded-[1.5rem] border border-border bg-background">
                  <div className="flex items-center justify-between px-5 pt-6 pb-3">
                    <span className="text-sm font-semibold text-foreground">
                      Remitovate
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      Invoices
                    </span>
                  </div>

                  <div className="px-5 pb-2">
                    <button
                      type="button"
                      className="flex w-full items-center justify-center rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                      + New Invoice
                    </button>
                  </div>

                  <div className="mx-5 space-y-3 pb-6 pt-2">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          INV-0024
                        </span>
                        <span className="inline-flex rounded-md border border-muted-foreground/30 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Draft
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        Sarah Johnson
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        ₦170,000
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          INV-0023
                        </span>
                        <span className="inline-flex rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                          Paid
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        David Smith
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        ₦85,000
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Invoice from wherever your work takes you.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Remitovate is designed to work comfortably on your phone. Create
              invoices, check statuses and manage clients without being tied to a
              desk.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
