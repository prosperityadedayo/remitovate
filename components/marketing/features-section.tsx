import {
  Building2,
  Users,
  Hash,
  LayoutTemplate,
  Zap,
  FileDown,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Save your business details",
    description:
      "Add your logo, brand colour, contact details and invoice preferences once. No more retyping the same information.",
  },
  {
    icon: Users,
    title: "Remember your customers",
    description:
      "Store customer information locally so every new invoice starts with their details already filled in.",
  },
  {
    icon: Hash,
    title: "Automatic invoice numbering",
    description:
      "Invoices are numbered sequentially with your chosen prefix. Stay consistent without manual tracking.",
  },
  {
    icon: LayoutTemplate,
    title: "Professional invoice templates",
    description:
      "Clean, print-ready layouts that look polished and trustworthy. Your clients get a professional experience.",
  },
  {
    icon: Zap,
    title: "Fast invoice creation",
    description:
      "With everything saved upfront, creating a new invoice takes seconds instead of minutes.",
  },
  {
    icon: FileDown,
    title: "Download ready-to-send PDFs",
    description:
      "Generate clean PDFs that are ready to attach to an email or share through any channel.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to invoice without the busywork.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Set it up once and let Remitovate handle the repetition.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
