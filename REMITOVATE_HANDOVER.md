# REMITOVATE — HANDOVER DOCUMENT

## 1. Product Overview

Remitovate is a modern invoicing and payment assistant for freelancers, creators, consultants, contractors, agencies, and small businesses. The core promise is: Create invoices. Send them. Get paid.

The product should feel like a real SaaS product, not a portfolio demo, and should reduce repetitive work by letting users set up their business once and then quickly create invoices without repeatedly entering business information, logos, brand colours, invoice numbering, currency, payment terms, or customer information.

## 2. Company Ownership

Remitovate is a product developed by **Perfect Eagle Complete Business Solutions**.

Official company website: https://prosperityadedayo.github.io/perfect-eagle-complete-business-solution/

Supabase is ONLY part of the technical infrastructure. Do NOT describe Remitovate as "powered by Supabase" or imply that Supabase owns, operates, or powers the business.

When company attribution is required, use: **"Remitovate — by Perfect Eagle Complete Business Solutions"**

Supabase should only appear where a technical attribution, documentation, configuration, or legal requirement genuinely requires it.

## 3. Current Technology Stack

**Frontend**
- Next.js 16 (App Router, latest)
- TypeScript (strict mode enabled)
- Tailwind CSS v3.4
- Lucide React icons
- next-themes (installed, light mode only in PASS 0)
- shadcn/ui (New York style, RSC enabled)

**Backend / Infrastructure**
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage (planned for logos)
- Vercel (deployment target)

**UI Primitives**
- Radix UI (@radix-ui/react-*)
- class-variance-authority
- clsx + tailwind-merge

## 4. Current Folder Structure

```
remitovate/
  AGENTS.md
  REMITOVATE_HANDOVER.md  ← this file
  app/
    globals.css
    layout.tsx
    page.tsx
    favicon.ico
    opengraph-image.png
    twitter-image.png
    auth/
      login/page.tsx
      sign-up/page.tsx
      forgot-password/page.tsx
      update-password/page.tsx
      confirm/route.ts
      error/page.tsx
      sign-up-success/page.tsx
    protected/
      layout.tsx
      page.tsx
  components/
    ui/
      badge.tsx
      button.tsx
      card.tsx
      checkbox.tsx
      dropdown-menu.tsx
      input.tsx
      label.tsx
      separator.tsx
      avatar.tsx
      skeleton.tsx
      alert.tsx
      toast.tsx
    auth-button.tsx
    login-form.tsx
    sign-up-form.tsx
    forgot-password-form.tsx
    update-password-form.tsx
    logout-button.tsx
    theme-switcher.tsx
  lib/
    supabase/
      server.ts
      client.ts
      proxy.ts
    utils.ts
  types/
    index.ts
  proxy.ts
  tailwind.config.ts
  next.config.ts
  tsconfig.json
  package.json
  package-lock.json
  eslint.config.mjs
  postcss.config.mjs
  .env.example
```

## 5. Current Dependencies

**Runtime**
- `next`, `react`, `react-dom`
- `@supabase/ssr`, `@supabase/supabase-js`
- `lucide-react`
- `next-themes`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- Radix UI primitives (`@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-slot`, `@radix-ui/react-avatar`)
- `tailwindcss-animate`

**Dev**
- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- `tailwindcss`, `postcss`, `autoprefixer`
- `eslint`, `eslint-config-next`

No additional dependencies beyond the starter kit baseline plus `@radix-ui/react-avatar` were added in PASS 0.

## 6. Supabase Setup Status

**Client architecture:** Implemented and functional.
- `lib/supabase/server.ts` — Server Component / Route Handler client using `@supabase/ssr` with `cookies()`.
- `lib/supabase/client.ts` — Browser client using `@supabase/ssr`.
- `lib/supabase/proxy.ts` — Next.js Proxy middleware for session refresh.
- `proxy.ts` — Top-level proxy entry point.

**Environment variables required (NOT yet configured in tracked files):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The developer must create `.env.local` from `.env.example` and fill in real values.

**No production database tables created yet.** Only auth flows are implemented.

## 7. Authentication Status

Implemented using Supabase Auth with cookie-based server-side session management.

**Pages:**
- `/auth/sign-up` — Email/password sign up with redirect to `/auth/sign-up-success`
- `/auth/login` — Email/password login with redirect to `/protected`
- `/auth/forgot-password` — Password reset email with redirect to `/auth/update-password`
- `/auth/update-password` — Set new password with redirect to `/protected`
- `/auth/confirm` — Email OTP verification (`token_hash`)
- `/auth/error` — Auth error display
- `/auth/sign-up-success` — Confirmation prompt

**Session management:**
- Proxy middleware (`proxy.ts`) refreshes session on every request.
- Unauthenticated users are redirected to `/auth/login` for protected routes.

**Redirect targets are placeholders.** `/protected` is a temporary landing page. Real dashboard routing will be established in PASS 3.

## 8. Current UI Pages

**Public:**
- `/` — Marketing home with Remitovate branding, hero, and auth CTAs (Sign in + Sign up)

**Auth:**
- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/update-password`
- `/auth/confirm`
- `/auth/error`
- `/auth/sign-up-success`

**Protected (placeholder):**
- `/protected` — Basic protected page showing user claims and placeholder text

## 9. Current Design System

**Colors:** Updated from default shadcn/ui neutral to Remitovate brand colors in `app/globals.css`.
- Primary: Indigo-based (`#4F46E5` equivalent in HSL: `238 84% 67%`)
- Background: White
- Secondary/Muted: Slate-50 family
- Foreground: Slate-900 family
- Border: Slate-200 family
- Semantic colors: Success, Warning, Error, Info mapped

**Typography:** Geist Sans via `next/font/google`. No custom font files.

**Mode:** Light mode only. Dark mode CSS variables were intentionally removed. `next-themes` is installed but unused.

**Radius:** `0.5rem` (`--radius`).

**Icons:** Lucide React only. No emojis in UI.

**Responsive:** Mobile-first Tailwind classes used throughout. No mobile overflow issues identified.

**Foundation UI components added in PASS 0:**
- `separator.tsx`
- `avatar.tsx`
- `skeleton.tsx`
- `alert.tsx`
- `toast.tsx` + `Toaster` export

## 10. Current Git State

**Branch:** `main`
**Remote:** `origin` → `https://github.com/prosperityadedayo/remitovate.git`
**Status:** Working tree clean. Branch is 1 commit ahead of `origin/main`.
**Recent commits:**
- `aa0c4cb` — feat: eatablish remitovate foundation
- `e487300` — Initial commit from Create Next App

No uncommitted changes. No untracked files.

## 11. What PASS 0 Completed

- Verified Next.js, TypeScript, Tailwind, and Supabase client architecture.
- Established design tokens with Remitovate color system in `app/globals.css`.
- Removed dark mode CSS variables and `darkMode` from Tailwind config.
- Added missing foundation UI primitives (separator, avatar, skeleton, alert, toast).
- Created `types/index.ts` with base domain types (Profile, Business, Customer, Invoice, InvoiceItem).
- Removed starter-kit artifacts (tutorial components, deploy button, env-var warning, logos, hero).
- Updated root layout metadata to Remitovate branding.
- Updated marketing home page to Remitovate placeholder with both Sign in and Sign up actions.
- Updated protected layout branding and removed references to deleted components.
- Configured ESLint to ignore `.next/` generated artifacts, eliminating pre-existing lint noise.
- Verified `npm run lint` passes (0 errors).
- Verified `npm run build` passes.

## 12. What PASS 0 Intentionally Did Not Implement

- No production database tables (profiles, businesses, customers, invoices, invoice_items).
- No Row Level Security (RLS) policies.
- No real Supabase data integration.
- No dashboard, invoice management, customers, settings, or PDF generation.
- No application shell (sidebar, mobile navigation, header, account menu).
- No marketing website beyond the home page placeholder.
- No dark mode support (light mode only).
- No AI features.
- No payment integrations.

## 13. PASS 1 Requirements (Marketing Website)

From AGENTS.md, PASS 1 must implement:
- Navbar
- Hero section
- Invoice preview
- Features section
- How it works section
- AI Quick Invoice section
- Mobile section
- CTA section
- Footer

The marketing site should be built before authentication flows are finalized.

## 14. PASS 2 Requirements (Authentication)

From AGENTS.md, PASS 2 must implement:
- Sign up
- Login
- Logout
- Forgot password
- Auth states
- Supabase Auth integration

**Theme requirement:** PASS 2 must include proper light/dark/system theme support. `next-themes` is already installed but unused. The theme switcher component exists at `components/theme-switcher.tsx` but should be reviewed and integrated into the auth flow and app shell. Dark mode CSS variables were removed in PASS 0 and must be restored if dark mode is required.

## 15. Important Architectural Decisions

- **Cookie-based auth:** Server-side authentication uses Supabase cookie handling via `@supabase/ssr`. No service-role keys are exposed to the browser.
- **Proxy middleware:** Session refresh and auth redirects are handled at the edge via Next.js Proxy (`proxy.ts`), not traditional middleware.
- **No repository/service layers:** The project follows the AGENTS.md directive to keep architecture simple. Data access will use direct Supabase client calls in Server Components and Route Handlers.
- **Path alias:** `@/*` maps to project root.
- **shadcn/ui:** Components are added manually or via CLI into `components/ui/`. No custom wrapper components unless genuinely needed.
- **Branding ownership:** Remitovate is owned by Perfect Eagle Complete Business Solutions. Supabase is infrastructure only.

## 16. Important Things Future AI Agents Must NOT Change

- **Do NOT re-introduce dark mode CSS variables** unless explicitly instructed by the user.
- **Do NOT move or rename the Supabase client files** (`lib/supabase/server.ts`, `client.ts`, `proxy.ts`) without understanding the proxy architecture.
- **Do NOT introduce paid infrastructure** or unnecessary frameworks.
- **Do NOT modify `AGENTS.md`** without explicit instruction.
- **Do NOT create database tables** without explicit instruction and database design review.
- **Do NOT commit secrets or API keys** to tracked files.
- **Do NOT change the company ownership branding.** Always use "Remitovate — by Perfect Eagle Complete Business Solutions" for attribution.
- **Do NOT run destructive Git commands** (`git reset --hard`, `git clean -fd`, `git push --force`, branch deletion) without explicit approval.
- **Do NOT implement future passes** out of order. Follow the controlled pass sequence defined in `AGENTS.md`.

## 17. Next Immediate Task

**Execute PASS 1: Marketing Website**

Build the public-facing marketing pages before diving into the authenticated application. PASS 1 requires:
1. A proper marketing navbar with Remitovate branding and auth CTAs.
2. A hero section with clear value proposition.
3. An invoice preview/visual section.
4. Features section.
5. How it works section.
6. AI Quick Invoice section.
7. Mobile section.
8. CTA section.
9. Footer with company attribution.

After PASS 1 is complete, run `npm run lint`, `npm run build`, report changes, and stop. Do not proceed to PASS 2 until explicitly instructed.
