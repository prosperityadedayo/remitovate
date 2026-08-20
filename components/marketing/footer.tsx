import Link from "next/link";

const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#ai-invoice", label: "AI Invoice" },
];

const accountLinks = [
  { href: "/auth/login", label: "Sign in" },
  { href: "/auth/sign-up", label: "Sign up" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Product</p>
              <ul className="mt-4 space-y-3">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Account</p>
              <ul className="mt-4 space-y-3">
                {accountLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Company</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="https://prosperityadedayo.github.io/perfect-eagle-complete-business-solution/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Perfect Eagle Complete Business Solutions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border py-6">
          <p className="text-center text-xs text-muted-foreground">
            <a
              href="https://prosperityadedayo.github.io/perfect-eagle-complete-business-solution/"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Remitovate — by Perfect Eagle Complete Business Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
