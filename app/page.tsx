import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Remitovate</Link>
            </div>
            <div className="flex gap-2">
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4 text-sm"
              >
                Sign up
              </Link>
              <Link
                href="/auth/login"
                className="underline underline-offset-4 text-sm"
              >
                Sign in
              </Link>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex flex-col gap-6 items-center text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Create invoices. Send them. Get paid.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Remitovate is a modern invoicing and payment assistant for freelancers, creators, and small businesses.
            </p>
            <div className="flex gap-4 mt-4">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-8"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-8"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            <a
              href="https://prosperityadedayo.github.io/perfect-eagle-complete-business-solution/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Remitovate — by Perfect Eagle Complete Business Solutions
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
