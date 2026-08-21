# REMITOVATE — HANDOVER DOCUMENT

## 1. Product Overview

Remitovate is a modern invoicing and payment assistant for freelancers, creators, consultants, contractors, agencies, and small businesses. The core promise is: Create invoices. Send them. Get paid.

The product should feel like a real SaaS product, not a portfolio demo, and should reduce repetitive work by letting users set up their business once and then quickly create invoices without repeatedly entering business information, logos, brand colours, invoice numbering, currency, payment terms, or customer information.

**Company attribution:** Remitovate — by Perfect Eagle Complete Business Solutions  
**Company website:** https://prosperityadedayo.github.io/perfect-eagle-complete-business-solution/

Supabase is ONLY part of the technical infrastructure. Do NOT describe Remitovate as "powered by Supabase" or imply that Supabase owns, operates, or powers the business. Supabase should only appear where a technical attribution, documentation, configuration, or legal requirement genuinely requires it.

## 2. Product Philosophy

The product reduces repetitive work. A user sets up their business once and can then return later to quickly create invoices without re-entering:

- business information
- logo
- brand colours
- invoice numbering
- currency
- payment terms
- customer information

## 3. Current Technology Stack

**Frontend**
- Next.js 16 App Router
- TypeScript (strict mode enabled)
- Tailwind CSS v3.4
- Lucide React icons
- next-themes (light / dark / system theme support)
- shadcn/ui (New York style, RSC enabled)

**Backend / Infrastructure**
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
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
    dashboard/
      layout.tsx
      page.tsx
      onboarding/page.tsx
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
    dashboard/
      sidebar.tsx
      header.tsx
      account-menu.tsx
      dashboard-shell.tsx
      mobile-sidebar.tsx
      logo-upload.tsx
  actions/
    business.ts
    dashboard.ts
    upload.ts
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
  supabase/
    migrations/
      20240101000000_init_schema.sql
      20240101000001_private_storage_rls.sql
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

**Database:** Application tables have been created via migration and Row Level Security is enabled. The initial schema migration includes `profiles`, `businesses`, `customers`, `invoices`, and `invoice_items`.

**Storage:** The `business-logos` bucket is configured as **Private** with path-based Storage RLS policies. Signed URLs are used when displaying logos.

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

## 8. Current Routes

**Public routes:**
- `/` — Full marketing website with Remitovate branding, hero, invoice preview, features, how it works, AI Quick Invoice, mobile section, CTA, and footer

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
- `/dashboard` — Authenticated dashboard with sidebar, header, account menu, stats cards, recent invoices, quick actions, and onboarding gate
- `/dashboard/onboarding` — First-time business setup (name, email, phone, address, country, currency, logo upload, brand colour, invoice prefix, starting number, payment terms, template)

**Planned / future routes (not yet implemented):**
- `/invoices` — Invoice list and management (PASS 4+)
- `/customers` — Customer management (PASS 4+)
- `/settings` — Business settings (PASS 7+)

## 9. Current Design System

Remitovate uses a premium SaaS design language:

- Clean, minimal, professional, trustworthy
- Financial/productivity oriented
- Indigo primary (`#4F46E5`) used strategically for CTAs, highlights, and active states
- Neutral whites and slates for backgrounds and surfaces
- Strong typographic hierarchy with Geist Sans
- Generous whitespace and consistent vertical rhythm
- Subtle motion (hover transitions, button transitions, dropdown transitions, page transitions, skeleton loading)
- Lucide React icons throughout
- No emojis in UI
- Mobile-first responsive design

**Colors (CSS variables in `app/globals.css`):**
- Primary: `238 84% 67%`
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
- Background: `222.2 47% 8%`
- Surface: `217.2 33% 11%`
- Primary text: `210 40% 98%`
- Secondary text: `215 16% 65%`
- Muted text: `215 16% 65%`
- Border: `217.2 33% 17%`

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

**Dashboard components:**
- `sidebar.tsx` — Desktop sidebar with Remitovate branding and navigation
- `header.tsx` — Sticky header with hamburger menu (mobile), search placeholder, theme switcher, and account menu
- `account-menu.tsx` — Dropdown with user email, business logo avatar, and logout
- `dashboard-shell.tsx` — Client shell managing sidebar, header, main content, and mobile drawer state
- `mobile-sidebar.tsx` — Slide-out drawer for mobile navigation with overlay and Escape key support
- `logo-upload.tsx` — Logo upload with 1:1 canvas crop and 2MB max validation

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
**Recent commits:**
- `3986635` — fix: secure business logo storage
- `7b9dc5d` — feat: build dashboard and business onboarding
- `cc92106` — docs: update project handover after pass 2
- `351f83e` — feat: implement authentication and theming
- `1c57226` — feat: build remitovate marketing website
- `9d5c4ef` — docs: add project handover
- `aa0c4cb` — feat: eatablish remitovate foundation
- `e487300` — Initial commit from Create Next App

## 11. What PASS 0 Completed

- Verified Next.js, TypeScript, Tailwind, and Supabase client architecture.
- Established design tokens with Remitovate color system in `app/globals.css`.
- Added foundation UI primitives.
- Created `types/index.ts` with base domain types.
- Removed starter-kit artifacts.
- Updated root layout metadata to Remitovate branding.
- Verified `npm run lint` passes.
- Verified `npm run build` passes.

## 12. What PASS 0 Intentionally Did Not Implement

- No production database tables.
- No Row Level Security (RLS) policies.
- No real Supabase data integration.
- No dashboard, invoice management, customers, settings, or PDF generation.
- No marketing website beyond the home page placeholder.
- No dark mode support.

## 13. PASS 1 — Marketing Website (COMPLETE)

PASS 1 implemented the full public-facing marketing website:

- **Navbar** — Sticky top navigation with Remitovate branding, section links, Sign in / Sign up CTAs, and responsive mobile menu
- **Hero** — Eyebrow badge, main headline, supporting copy, primary and secondary CTAs, and invoice preview visual
- **Invoice Preview** — Realistic invoice mockup
- **Features** — 6 feature cards in a responsive grid with Lucide icons
- **How It Works** — 3-step numbered process with desktop connector lines
- **AI Quick Invoice** — Split layout highlighting natural language to structured invoice transformation
- **Mobile Section** — Phone mockup showing invoice list with Draft/Paid statuses
- **CTA** — Final conversion section with primary and secondary actions
- **Footer** — Clean footer with company attribution to Perfect Eagle Complete Business Solutions

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

## 15. PASS 3 — Dashboard + Business Onboarding + Initial Database Architecture (COMPLETE)

PASS 3 implemented the authenticated application shell, business onboarding flow, and the complete initial database architecture with Row Level Security.

**Application shell:**
- **Dashboard layout** — `/dashboard/layout.tsx` with auth gate, sidebar, header, and mobile drawer shell
- **Desktop sidebar** — Remitovate branding, navigation links (Dashboard, Invoices, Customers, Settings), and company attribution
- **Mobile navigation** — Hamburger button toggles a slide-out drawer with overlay, Escape key support, and ARIA attributes
- **Header** — Sticky header with hamburger menu (mobile), search placeholder, theme switcher, and account menu
- **Account menu** — Dropdown showing authenticated user email, business logo avatar (with initials fallback), and logout
- **Mobile responsiveness** — Sidebar hidden on mobile, replaced by hamburger drawer; bottom mobile nav removed to avoid redundancy

**Business onboarding:**
- **Onboarding page** — `/dashboard/onboarding` serves as the first-time business setup flow
- **Business details** — Name, email, phone, address, country
- **Branding** — Logo upload with 1:1 canvas crop and 2MB max validation, brand colour picker
- **Invoice preferences** — Currency selection, invoice prefix, starting invoice number, default payment terms, invoice template
- **Onboarding gate** — New users without a business are redirected to `/dashboard/onboarding`; returning users go straight to `/dashboard`
- **Server action** — `createBusiness` creates the `profiles` and `businesses` records, uploads the logo to Supabase Storage, and redirects to `/dashboard`

**Dashboard:**
- **Statistics cards** — Total Invoiced, Paid, Outstanding, Overdue with currency formatting
- **Recent invoices** — List of recent invoices with customer name, status badge, total, and due date
- **Empty states** — Friendly empty states when no invoices exist
- **Quick actions** — Create Invoice, Add Customer, Business Settings (links to future pages)
- **Getting started guide** — 3-step checklist for new users

**Database architecture:**
- **profiles** — Linked to `auth.users(id)`; stores email and full_name
- **businesses** — One business per authenticated user (`user_id` is unique); stores business details, branding, and invoice preferences
- **customers** — Linked to `businesses(id)` and `auth.users(id)`; stores customer contact details
- **invoices** — Linked to `businesses(id)` and `customers(id)`; stores invoice metadata, totals, status, and payment info
- **invoice_items** — Linked to `invoices(id)`; stores line item details, quantities, pricing, discounts, and tax

**Row Level Security:**
- All application tables have RLS enabled
- Users can only access their own `profiles`, `businesses`, `customers`, `invoices`, and `invoice_items`
- Invoice and invoice item access is scoped through the owning business
- Storage RLS policies enforce per-user ownership of logos via path-based checks

**Storage:**
- **Bucket:** `business-logos`
- **Access:** Private
- **Path structure:** `{user_id}/{timestamp}.{extension}`
- **Display:** Signed URLs generated server-side via `getSignedLogoUrl()` with 1-year expiration
- **Ownership:** Storage RLS policies verify `auth.uid()::text = storage.foldername(name)[1]` to ensure users can only access their own logos

**Authentication protection:**
- `/dashboard` and `/dashboard/onboarding` require authentication
- Server-side auth gate redirects unauthenticated users to `/auth/login`
- Legacy `/protected` route redirects to `/dashboard`

## 16. Database Architecture

**Ownership model:**

```
auth.users
    ↓
profiles

auth.users
    ↓
businesses
    ↓
customers
    ↓
invoices
    ↓
invoice_items
```

**MVP decision:** One business per authenticated user. Multi-business support is not implemented.

**Tables:**

| Table | Purpose | Status |
|-------|---------|--------|
| `profiles` | User profile extension (email, full_name) | Implemented |
| `businesses` | Business details, branding, invoice preferences | Implemented |
| `customers` | Customer contact details per business | Database ready; CRUD not yet implemented |
| `invoices` | Invoice headers with totals and status | Database ready; CRUD not yet implemented |
| `invoice_items` | Invoice line items | Database ready; CRUD not yet implemented |

**Notes:**
- `customers`, `invoices`, and `invoice_items` tables exist as database groundwork for future passes.
- Their full application functionality (create, edit, delete, list, search, PDF generation) has NOT yet been implemented.
- Do not claim customer management, invoice creation, or PDF generation as implemented features.

**Schema rules:**
- UUID primary keys
- Foreign keys with `ON DELETE CASCADE`
- Timestamps (`created_at`, `updated_at`)
- Sensible defaults (NGN currency, Net 30 terms, modern template, draft status)
- Indexes on foreign keys and common query columns
- No exposed secrets

## 17. Security

**Row Level Security:**
- RLS is enabled on all application tables (`profiles`, `businesses`, `customers`, `invoices`, `invoice_items`)
- Users can only view, insert, update, and delete their own data
- Business-scoped tables (`customers`, `invoices`, `invoice_items`) enforce ownership through the linked business record

**Ownership rules:**
- A user can only access their own `profiles` record
- A user can only access their own `businesses` record
- A user can only access `customers` belonging to their business
- A user can only access `invoices` belonging to their business
- A user can only access `invoice_items` belonging to their business invoices

**Storage security:**
- `business-logos` bucket is **Private**
- Storage RLS policies enforce per-user ownership based on the storage object path
- Users can only upload, view, update, or delete objects in paths that begin with their own `auth.uid()`
- Signed URLs are used for display; public URLs are not used

**Authentication security:**
- Supabase Auth handles authentication; no custom password authentication
- Sessions are managed via secure HTTP-only cookies
- Proxy middleware refreshes sessions on every request
- No service-role keys are exposed to client code

## 18. Storage

**Architecture:**
- **Bucket:** `business-logos`
- **Access:** Private
- **Path structure:** `{user_id}/{timestamp}.{extension}`
- **Upload:** Server-side via `createBusiness` action; validates 2MB max and crops to 1:1 square before upload
- **Display:** Signed URLs generated by `getSignedLogoUrl()` server action with 1-year expiration
- **Ownership enforcement:** Storage RLS policies check `auth.uid()::text = storage.foldername(name)[1]`

**Manual setup required:**
1. Create the `business-logos` bucket in Supabase Dashboard → Storage
2. Set it to **Private**
3. Run the storage RLS migration (`supabase/migrations/20240101000001_private_storage_rls.sql`) in the SQL Editor

## 19. Authentication

Supabase Auth is used for all authentication.

**Flows:**
- **Sign up** — Email/password with email confirmation redirect to `/dashboard`
- **Login** — Email/password with redirect to `/dashboard`
- **Logout** — Server-side POST route
- **Forgot password** — Email reset flow
- **Update password** — Set new password after reset
- **Session persistence** — Cookie-based via `@supabase/ssr`

**Route protection:**
- Proxy middleware (`proxy.ts`) protects `/dashboard`, `/dashboard/onboarding`, and all non-public routes
- Unauthenticated users are redirected to `/auth/login`

## 20. Current Limitations

The following features are NOT yet implemented:

- Invoice creation, editing, and management
- Customer management (create, edit, delete, search, view history)
- PDF generation and download
- Invoice template rendering system (templates are stored but not rendered)
- AI Quick Invoice
- Email sending and sharing
- Payment integration
- Invoice numbering automation
- Dynamic currency display (currently hardcoded to NGN in some places)
- Search functionality (search input exists but is not wired)
- `/invoices`, `/customers`, `/settings` routes exist as navigation placeholders only

## 21. Future Passes

**PASS 0** — Foundation — COMPLETE  
**PASS 1** — Marketing Website — COMPLETE  
**PASS 2** — Authentication + Theming — COMPLETE  
**PASS 3** — Dashboard + Business Onboarding + Initial Database Architecture — COMPLETE  

**PASS 4** — Customers + Invoice Creation  
**PASS 5** — Invoice Templates + PDF Generation  
**PASS 6** — AI Quick Invoice + Smart Features  
**PASS 7** — Email + Sharing + Final MVP Polish  

Then:
- MVP TESTING
- DEPLOYMENT
- REAL USER TESTING

## 22. PASS 4 Preparation

PASS 4 is the next development task. It should focus on:

- Customer management (create, edit, delete, list, search/filter)
- Invoice creation workflow
- Invoice items (add, remove, edit)
- Calculations (subtotal, discount, tax, total)
- Invoice numbering
- Invoice validation
- Invoice persistence
- Invoice list / basic invoice management

Before PASS 4:
1. Read `AGENTS.md`
2. Read `REMITOVATE_HANDOVER.md`
3. Inspect the repository
4. Inspect database schema
5. Understand current authentication / business ownership architecture
6. Create a PASS 4 implementation plan
7. Ask questions about genuine ambiguities before coding

Do not begin PASS 5.  
Do not begin PDF generation.  
Do not begin AI.  
Do not begin email.  
Do not begin payments.

## 23. Zero-Capital Requirement

The architecture should remain compatible with free tiers wherever possible. Do not introduce paid infrastructure without explicit approval.

## 24. Development Rules

- Inspect the repository before modifying
- Ask when requirements are ambiguous
- Do not guess important architecture
- Do not implement future passes early
- Run `npm run lint` and `npm run build` after major changes
- Do not commit automatically
- Preserve working features
- Maintain mobile responsiveness
- Maintain accessibility
- Avoid unnecessary dependencies

## 25. Next Immediate Task

**NEXT TASK: PASS 4 — Customers + Invoice Creation**

Before PASS 4:
- read `AGENTS.md`
- read `REMITOVATE_HANDOVER.md`
- inspect repository
- inspect database schema
- understand current authentication / business ownership architecture
- create a PASS 4 implementation plan
- ask questions about genuine ambiguities before coding

Do not begin PASS 5.  
Do not begin PDF generation.  
Do not begin AI.  
Do not begin email.  
Do not begin payments.
