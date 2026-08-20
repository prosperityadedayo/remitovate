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
- Next.js 16 (App Router)
- TypeScript (strict mode enabled)
- Tailwind CSS v3.4
- Lucide React icons
- next-themes (light / dark / system theme support)
- shadcn/ui (New York style, RSC enabled)

**Backend / Infrastructure**
- Supabase Auth
- Supabase PostgreSQL (not yet configured with application tables)
- Supabase Storage (planned for business logos)
- Vercel (deployment target)

**UI Primitives**
- Radix UI (`@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-slot`)
- class-variance-authority
- clsx + tailwind-merge
- tailwindcss-animate

**Package manager:** npm

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
      signup/page.tsx
      forgot-password/page.tsx
      update-password/page.tsx
      reset-password/page.tsx
      confirm/route.ts
      error/page.tsx
      sign-up-success/page.tsx
      logout/route.ts
    protected/
      layout.tsx
      page.tsx
    dashboard/
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
    marketing/
      navbar.tsx
      hero-section.tsx
      invoice-preview.tsx
      features-section.tsx
      how-it-works.tsx
      ai-quick-invoice.tsx
      mobile-section.tsx
      cta-section.tsx
      footer.tsx
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
- Radix UI primitives (`@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-slot`)
- `tailwindcss-animate`

**Dev**
- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- `tailwindcss`, `postcss`, `autoprefixer`
- `eslint`, `eslint-config-next`

No additional dependencies beyond the baseline were added in PASS 1 or PASS 2.

## 6. Supabase Setup Status

**Client architecture:** Implemented and functional.
- `lib/supabase/server.ts` — Server Component / Route Handler client using `@supabase/ssr` with `cookies()`.
- `lib/supabase/client.ts` — Browser client using `@supabase/ssr`.
- `lib/supabase/proxy.ts` — Next.js Proxy middleware for session refresh and route protection.
- `proxy.ts` — Top-level proxy entry point.

**Environment variables required in `.env.local`:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The developer must create `.env.local` from `.env.example` and fill in real values. These files are not tracked in version control.

**No production database tables created yet.** Only Supabase Auth is being used. Application tables (profiles, businesses, customers, invoices, invoice_items) have not been created.

## 7. Authentication Status

Implemented using Supabase Auth with cookie-based server-side session management.

**Pages:**
- `/auth/sign-up` — Email/password sign up with redirect to `/auth/sign-up-success`
- `/auth/signup` — Alias for `/auth/sign-up`
- `/auth/login` — Email/password login with redirect to `/dashboard`
- `/auth/forgot-password` — Password reset email with redirect to `/auth/reset-password`
- `/auth/update-password` — Set new password with redirect to `/auth/login`
- `/auth/reset-password` — Alias for `/auth/update-password`
- `/auth/confirm` — Email OTP verification (`token_hash`)
- `/auth/error` — Auth error display with friendly messages
- `/auth/sign-up-success` — Confirmation prompt
- `/auth/logout` — Server-side logout POST route

**Session management:**
- Proxy middleware (`proxy.ts`) refreshes session on every request.
- Unauthenticated users are redirected to `/auth/login` for protected routes.
- Session persists across page refreshes using cookie-based auth.

**Route protection:**
- `/dashboard` requires authentication and redirects unauthenticated users to `/auth/login`.
- Proxy handles protection for all non-public routes.

## 8. Current UI Pages

**Public:**
- `/` — Full marketing website with Remitovate branding, hero, invoice preview, features, how it works, AI Quick Invoice, mobile section, CTA, and footer

**Auth:**
- `/auth/login`
- `/auth/sign-up`
- `/auth/signup`
- `/auth/forgot-password`
- `/auth/update-password`
- `/auth/reset-password`
- `/auth/confirm`
- `/auth/error`
- `/auth/sign-up-success`
- `/auth/logout` (POST route)

**Protected:**
- `/dashboard` — Placeholder confirming authentication works; full dashboard coming in PASS 3
- `/protected` — Legacy placeholder page from PASS 0

## 9. Current Design System

**Colors:** Remitovate brand colors defined in `app/globals.css`.
- Primary: Indigo (`#4F46E5` equivalent in HSL: `238 84% 67%`)
- Primary dark: `#4338CA`
- Primary light: `#EEF2FF`
- Background: `#FFFFFF`
- Secondary background: `#F8FAFC`
- Primary text: `#0F172A`
- Secondary text: `#475569`
- Muted text: `#64748B`
- Border: `#E2E8F0`
- Success: `#16A34A`
- Warning: `#D97706`
- Error: `#DC2626`
- Info: `#2563EB`

**Dark mode tokens:**
- Background: `#0B1120`
- Surface: `#111827`
- Elevated surface: `#172033`
- Primary text: `#F8FAFC`
- Secondary text: `#CBD5E1`
- Muted text: `#94A3B8`
- Border: `#1E293B`

**Typography:** Geist Sans via `next/font/google`. No custom font files.

**Mode:** Light, dark, and system theme support via `next-themes`. Theme preference persists across reloads.

**Radius:** `0.5rem` (`--radius`).

**Icons:** Lucide React only. No emojis in UI.

**Responsive:** Mobile-first Tailwind classes used throughout. Components are designed for 375px, 390px, 414px, 768px, 1024px, and 1440px.

**Foundation UI components:**
- `badge.tsx`
- `button.tsx`
- `card.tsx`
- `checkbox.tsx`
- `dropdown-menu.tsx`
- `input.tsx`
- `label.tsx`
- `separator.tsx`
- `avatar.tsx`
- `skeleton.tsx`
- `alert.tsx`
- `toast.tsx` + `Toaster` export

**Marketing components:**
- `navbar.tsx` — Sticky responsive navbar with auth-aware navigation and theme switcher
- `hero-section.tsx` — Hero with eyebrow badge, headline, CTAs, and invoice preview
- `invoice-preview.tsx` — Realistic invoice mockup
- `features-section.tsx` — 6 feature cards with Lucide icons
- `how-it-works.tsx` — 3-step process with numbered indicators
- `ai-quick-invoice.tsx` — AI feature highlight with natural language mockup
- `mobile-section.tsx` — Mobile UI mockup
- `cta-section.tsx` — Final conversion section
- `footer.tsx` — Company attribution and navigation links

**Authentication components:**
- `login-form.tsx`
- `sign-up-form.tsx`
- `forgot-password-form.tsx`
- `update-password-form.tsx`
- `auth-button.tsx`
- `logout-button.tsx`
- `theme-switcher.tsx`

## 10. Current Git State

**Branch:** `main`
**Remote:** `origin` → `https://github.com/prosperityadedayo/remitovate.git`
**Status:** Working tree has uncommitted changes from PASS 1 and PASS 2 implementation.
**Recent commits:**
- `aa0c4cb` — feat: establish remitovate foundation
- `e487300` — Initial commit from Create Next App

## 11. What PASS 0 Completed

- Verified Next.js, TypeScript, Tailwind, and Supabase client architecture.
- Established design tokens with Remitovate color system in `app/globals.css`.
- Added foundation UI primitives (separator, avatar, skeleton, alert, toast).
- Created `types/index.ts` with base domain types (Profile, Business, Customer, Invoice, InvoiceItem).
- Removed starter-kit artifacts (tutorial components, deploy button, env-var warning, logos, hero).
- Updated root layout metadata to Remitovate branding.
- Configured ESLint to ignore `.next/` generated artifacts.
- Verified `npm run lint` passes.
- Verified `npm run build` passes.

## 12. What PASS 0 Intentionally Did Not Implement

- No production database tables (profiles, businesses, customers, invoices, invoice_items).
- No Row Level Security (RLS) policies.
- No real Supabase data integration.
- No dashboard, invoice management, customers, settings, or PDF generation.
- No marketing website beyond the home page placeholder.
- No dark mode support.
- No AI features.
- No payment integrations.

## 13. PASS 1 — Marketing Website (COMPLETE)

PASS 1 implemented the full public-facing marketing website:

- **Navbar** — Sticky top navigation with Remitovate branding, section links, Sign in / Sign up CTAs, and responsive mobile menu
- **Hero** — Eyebrow badge, main headline, supporting copy, primary and secondary CTAs, and invoice preview visual
- **Invoice Preview** — Realistic invoice mockup (INV-0001, Sarah Johnson, ₦170,000 total, Draft status)
- **Features** — 6 feature cards in a responsive grid with Lucide icons
- **How It Works** — 3-step numbered process with desktop connector lines
- **AI Quick Invoice** — Split layout highlighting natural language to structured invoice transformation
- **Mobile Section** — Phone mockup showing invoice list with Draft/Paid statuses
- **CTA** — Final conversion section with primary and secondary actions
- **Footer** — Clean footer with Product, Account, and Company columns; company attribution to Perfect Eagle Complete Business Solutions

**Design characteristics:**
- Premium, minimal, professional, trustworthy
- Mobile-first responsive design
- Lucide React icons throughout; no emojis
- Subtle hover transitions and animations
- Indigo primary used strategically

## 14. PASS 2 — Authentication and Theming (COMPLETE)

PASS 2 implemented Supabase-powered authentication and a complete theme system:

**Authentication:**
- **Sign up** — `/auth/sign-up` and `/auth/signup` with email/password validation and friendly error messages
- **Sign in** — `/auth/login` with credential validation, friendly error messages, and redirect to `/dashboard`
- **Sign out** — Server-side logout via `/auth/logout` POST route
- **Forgot password** — `/auth/forgot-password` with neutral success message
- **Password reset** — `/auth/update-password` and `/auth/reset-password`
- **Session persistence** — Cookie-based via existing Supabase SSR architecture; sessions survive page refreshes
- **Route protection** — Proxy middleware protects `/dashboard` and all non-public routes; unauthenticated users redirect to `/auth/login`
- **Auth-aware navigation** — Marketing navbar shows Dashboard + Sign out when logged in, Sign in + Sign up when logged out
- **Error handling** — User-friendly error messages; raw Supabase errors are not exposed to users
- **Loading states** — Buttons disabled during submission; navbar shows skeleton during auth check

**Theming:**
- **Light / Dark / System** — Full dark mode CSS variable set in `app/globals.css`
- **Theme switcher** — Accessible dropdown with Sun / Moon / Monitor icons via Lucide React
- **Persistent preference** — `next-themes` with `enableSystem` and `disableTransitionOnChange`
- **Dark mode design** — Deliberate dark tokens for backgrounds, surfaces, text, and borders
- **Theme-aware components** — Marketing components use `bg-background`, `text-foreground`, `border-border` instead of hardcoded colors

## 15. Supabase Database Status

Supabase Auth is currently being used for authentication only.

The following application tables are NOT yet implemented:
- profiles
- businesses
- customers
- invoices
- invoice_items
- payments
- subscriptions
- notifications
- email_logs
- ai_generations

The application data model will be designed deliberately in a future pass before any tables are created.

## 16. Current Routes

**Public routes:**
- `/` — Marketing home page

**Authentication routes:**
- `/auth/login`
- `/auth/sign-up`
- `/auth/signup`
- `/auth/forgot-password`
- `/auth/update-password`
- `/auth/reset-password`
- `/auth/confirm`
- `/auth/error`
- `/auth/sign-up-success`
- `/auth/logout` (POST)

**Protected routes:**
- `/dashboard` — Authenticated placeholder
- `/protected` — Legacy placeholder

## 17. Current UI

**Marketing components (`components/marketing/`):**
- `navbar.tsx`
- `hero-section.tsx`
- `invoice-preview.tsx`
- `features-section.tsx`
- `how-it-works.tsx`
- `ai-quick-invoice.tsx`
- `mobile-section.tsx`
- `cta-section.tsx`
- `footer.tsx`

**Authentication components:**
- `login-form.tsx`
- `sign-up-form.tsx`
- `forgot-password-form.tsx`
- `update-password-form.tsx`
- `auth-button.tsx`
- `logout-button.tsx`
- `theme-switcher.tsx`

**UI primitives (`components/ui/`):**
- `badge.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `separator.tsx`, `avatar.tsx`, `skeleton.tsx`, `alert.tsx`, `toast.tsx`

## 18. Design System

Remitovate uses a premium SaaS design language:

- Clean, minimal, professional, trustworthy
- Financial/productivity oriented
- Indigo primary (`#4F46E5`) used strategically for CTAs, highlights, and active states
- Neutral whites and slates for backgrounds and surfaces
- Strong typographic hierarchy with Geist Sans
- Generous whitespace and consistent vertical rhythm
- Subtle motion (hover transitions, button transitions, dropdown transitions)
- Lucide React icons throughout
- No emojis in UI
- Mobile-first responsive design

## 19. Product Workflow

**Intended eventual user workflow:**
1. Sign up
2. Business setup
3. Upload logo
4. Choose template
5. Add customer
6. Create invoice
7. Download PDF
8. Send/share
9. Track status

**Planned AI Quick Invoice workflow:**
1. Natural language description
2. Structured invoice
3. Professional invoice

These workflows are planned and not yet implemented.

## 20. Future Pass Roadmap

**PASS 0** — Foundation — COMPLETE

**PASS 1** — Marketing Website — COMPLETE

**PASS 2** — Supabase Auth + Route Protection + Themes — COMPLETE

**PASS 3** — Dashboard + Business Onboarding — NEXT

**PASS 4** — Customers + Invoice Creation

**PASS 5** — Invoice Templates + PDF Generation

**PASS 6** — AI Quick Invoice + Smart Features

**PASS 7** — Email + Sharing + Final MVP Polish

Then:
- MVP TESTING
- DEPLOYMENT
- REAL USER TESTING

## 21. PASS 3 Preview

PASS 3 will focus on:
- Authenticated dashboard
- Business onboarding
- Business profile
- Logo upload
- Brand colour selection
- Invoice preferences
- Invoice numbering preferences
- Currency selection
- Invoice template selection
- Supabase Storage for business logos
- Database schema design
- Row Level Security (RLS)

**Important:** The database schema must be designed deliberately before creating production tables. Every user's data must be isolated using proper Supabase Row Level Security.

## 22. Important Product Principles

1. Remitovate is a real product, not merely a CRUD portfolio project.
2. The core value proposition is reducing repetitive invoice creation.
3. Users configure their business once and reuse that information.
4. Invoice numbers should be managed automatically.
5. Users should not repeatedly upload their logo.
6. Users should be able to save customers.
7. Professional invoice templates are a core feature.
8. PDF generation is a core MVP capability.
9. AI Quick Invoice is a differentiating feature but the core invoicing system must not depend on AI.
10. The application should remain zero-capital/free-tier friendly during MVP development.
11. Do not introduce paid APIs unnecessarily.
12. Do not implement future functionality early.
13. Ask the developer when a major product or architectural decision is unclear rather than guessing.

## 23. Security Principles

- Supabase Auth is responsible for authentication.
- Do not build custom password authentication.
- Never store passwords.
- Never expose service-role keys to client code.
- Authentication sessions use the established Supabase/Next.js cookie-based architecture.
- Future application tables must use Row Level Security.
- Users must only access their own business/customer/invoice data.

## 24. Next Immediate Task

The next task is:

**PASS 3 — Dashboard + Business Onboarding + Initial Application Data Architecture**

Before implementation:
1. Review the existing repository.
2. Review this handover.
3. Design the database schema before creating application tables.
4. Define relationships.
5. Define Row Level Security requirements.
6. Determine the appropriate Supabase Storage strategy for business logos.
7. Ask the developer about any genuine ambiguity.

Do not implement Pass 4 functionality.
Do not implement customer management or full invoice creation yet.
Do not begin Pass 3 automatically. The developer will explicitly authorize Pass 3.
