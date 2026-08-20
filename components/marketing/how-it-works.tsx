const steps = [
  {
    number: "01",
    title: "Set up your business",
    description:
      "Add your logo, brand colour, business details and invoice preferences once. Everything is saved for future use.",
  },
  {
    number: "02",
    title: "Add your customer",
    description:
      "Save customer information so you do not have to repeatedly type it for every new invoice.",
  },
  {
    number: "03",
    title: "Create and download",
    description:
      "Add your items and generate a professional invoice ready to send or download as a PDF.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 lg:py-32 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to faster invoicing.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-12 sm:mt-20 lg:max-w-none lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-start">
              {index < steps.length - 1 && (
                <div
                  className="absolute left-5 top-10 hidden h-full w-px bg-border lg:block"
                  aria-hidden="true"
                />
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-foreground shadow-sm">
                {step.number}
              </div>
              <h3 className="mt-6 text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
