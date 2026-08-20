"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#ai-invoice", label: "AI Invoice" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 dark:bg-background/80 dark:supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Remitovate
            </Link>
          </div>

          <nav className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex md:items-center md:gap-3">
            <ThemeSwitcher />
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <form action="/auth/logout" method="POST">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/sign-up">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            {!loading && <ThemeSwitcher />}
            <Button
              variant="ghost"
              size="icon"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
            >
              {open ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background dark:bg-background md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              {loading ? (
                <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
              ) : user ? (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <form action="/auth/logout" method="POST">
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setOpen(false)}
                    >
                      Sign out
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth/login" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/sign-up" onClick={() => setOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
