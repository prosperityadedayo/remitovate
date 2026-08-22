# REMITOVATE — HANDOVER DOCUMENT

## 1. Current Project Status

**Status:** PASS 6 complete. Invoice creation pipeline is fully functional end-to-end (with database migration applied). PASS 7 is blocked on migration application to the remote Supabase database.

**Git state:** Clean working tree on `main`. Latest commit: `4c8c863 feat: implement invoice creation and preview`.

**Remote:** `origin` → `https://github.com/prosperityadedayo/remitovate.git`

**Supabase project:** `tkulugquyftptpijtske`

---

## 2. Architecture

### High-level data flow

```
auth.users  (Supabase Auth)
    │
    ▼
profiles     (one row per user)
    │
    ▼
businesses   (one business per user — MVP decision)
    │
    ├─────────────────────────────┐
    ▼                             ▼
customers  (per business)    invoices  (per business)
                                  │
                                  ▼
                           invoice_items  (per invoice)
```

### Ownership model

- Every server action derives `business_id` from `auth.uid()` via `getBusinessId()`. No client-supplied business IDs are trusted.
- All reads and writes are scoped by `business_id` at the query level.
- Row Level Security (RLS) is the final security boundary on every table.
- `/dashboard` routes require authentication and redirect unauthenticated users to `/auth/login`.
- `/invoices/*` and `/customers/*` routes require both authentication and a business; unauthenticated users redirect to `/auth/login`, users without a business redirect to `/dashboard/onboarding`.

### Server actions

All server actions live in `app/actions/` and use `"use server"`:

| File | Functions | Used by |
|------|-----------|---------|
| `business.ts` | `createBusiness(formData)` | Onboarding form |
| `customers.ts` | `getCustomers(search?)`, `getCustomerById(id)`, `createCustomer(formData)`, `updateCustomer(id, formData)`, `deleteCustomer(id)` | Customer pages |
| `invoices.ts` | `getCustomersForInvoice()`, `getBusinessForInvoice()`, `createInvoice(data)`, `getInvoiceById(id)`, `getInvoices()` | Invoice pages |
| `dashboard.ts` | `getBusinessId()`, `getDashboardStats()`, `getRecentInvoices()`, `getBusinessSetupStatus()` | Dashboard page |
| `upload.ts` | `getSignedLogoUrl(path)` | Account menu, customer detail |

### Supabase client architecture

- `lib/supabase/server.ts` — Server Component / Route Handler client using `@supabase/ssr` with `cookies()`.
- `lib/supabase/client.ts` — Browser client using `@supabase/ssr`.
- `lib/supabase/proxy.ts` — Middleware (`proxy.ts` at root) for session refresh on every request. Unauthenticated users on non-public routes are redirected to `/auth/login`.
- `.env.example` provides template; `.env.local` is gitignored.

---

## 3. Implemented Features

### Authentication & Business Onboarding

- **Sign up** — `/auth/sign-up`, `/auth/signup` (alias) — email/password with validation, redirects to `/auth/sign-up-success`
- **Sign in** — `/auth/login` — email/password with friendly error messages, redirects to `/dashboard`
- **Sign out** — `/auth/logout` — server-side POST route
- **Forgot password** — `/auth/forgot-password` — sends reset email
- **Reset password** — `/auth/update-password`, `/auth/reset-password` (alias)
- **Email confirmation** — `/auth/confirm` — OTP verification route
- **Error handling** — `/auth/error` — friendly error messages
- **Route protection** — proxy middleware + per-layout auth gates
- **Theme system** — light/dark/system with `next-themes`, theme switcher in header, `Toaster` in root layout

### Business Onboarding

- `/dashboard/onboarding` — first-time setup flow
- Fields: business name, email, phone, address, country, currency, logo upload (1:1 crop, 2MB max), brand colour picker, invoice prefix, starting invoice number, default payment terms, invoice template
- `createBusiness` server action: creates `profiles` + `businesses` records, uploads logo to private storage, sets `next_invoice_number` from starting number
- Onboarding gate: users without a business are redirected to onboarding from `/dashboard`, `/customers/*`, and `/invoices/*`

### Dashboard

- `/dashboard` — authenticated overview
- 4 stat cards: Total Invoiced, Paid, Outstanding, Overdue (via `get_dashboard_stats` RPC)
- Recent invoices list (5 most recent) with customer name, status, total, due date
- Quick actions: New Invoice, Add Customer
- Getting started checklist (business profile, first customer, first invoice)
- Setup indicator banner when data is missing
- Empty states and skeleton loading throughout

### Customers (PASS 5)

- `/customers` — list with search (debounced, URL-synced), count, empty state, skeleton loading
- `/customers/new` — create form with validation, toast feedback
- `/customers/[id]` — detail view with contact info grid, breadcrumbs, edit/delete actions, invoice history empty state
- `/customers/[id]/edit` — edit form pre-filled with data
- Delete safety: blocked if customer has invoices, with clear error message
- Inline two-step delete confirmation with toast
- Responsive: stacked cards on mobile, table rows on desktop

### Invoices (PASS 6)

- `/invoices` — invoice list with status badges, currency formatting, empty state, "New Invoice" button
- `/invoices/new` — invoice builder with:
  - Customer selection (custom branded Select component)
  - Invoice date, due date (auto-defaulted from payment terms)
  - Line items (add/remove, description, quantity, unit price, discount type/amount, tax rate, live line total)
  - Live calculations: subtotal, discount, tax, total
  - Notes and payment information fields
  - Form validation with toast feedback
  - Skeleton loading state
- `/invoices/[id]` — invoice detail/preview page with:
  - Business info (name, email, phone, address, country)
  - Customer billing info
  - Invoice dates
  - Line items table (description, qty, price, discount, tax, total)
  - Totals summary (subtotal, discount, tax, total)
  - Notes and payment information sections
  - Status badge
- Server actions: `createInvoice` (uses atomic RPC), `getInvoiceById` (maps `invoice_items` → `items`), `getInvoices`, `getCustomersForInvoice`, `getBusinessForInvoice`
- Atomic invoice creation via `create_invoice_with_items` PostgreSQL RPC
- Automatic invoice numbering via `next_invoice_number` column (incremented atomically in the RPC)

### Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile extension (email, full_name) — 1:1 with `auth.users` |
| `businesses` | Business details, branding, invoice preferences — 1:1 with `auth.users` |
| `customers` | Customer contact details — 1 business : many customers |
| `invoices` | Invoice headers with totals and status — invoices belong to business + customer |
| `invoice_items` | Line items — invoices have many items |

All tables use UUID primary keys, foreign keys with `ON DELETE CASCADE`/`SET NULL`, timestamps, sensible defaults (NGN, Net 30, draft status), and indexes on FK columns.

### Row Level Security

- RLS enabled on all application tables: `profiles`, `businesses`, `customers`, `invoices`, `invoice_items`
- Users access only their own data, scoped through business ownership
- Storage bucket `business-logos` is private with path-based ownership policies

### Storage

- Bucket: `business-logos` (Private)
- Path: `{user_id}/{timestamp}.{extension}`
- Display: signed URLs (1-year expiry) via `getSignedLogoUrl()`

### Migrations

| Migration | Pass | Description |
|-----------|------|-------------|
| `20240101000000_init_schema.sql` | Pass 3 | Core schema: profiles, businesses, customers, invoices, invoice_items, RLS policies, storage policies |
| `20240101000001_private_storage_rls.sql` | Pass 3 | Storage RLS policies for business-logos bucket |
| `20240101000002_dashboard_stats_rpc.sql` | Pass 4 | `get_dashboard_stats` RPC for dashboard aggregation |
| `20240101000003_customer_deletion_safety.sql` | Pass 5 | Makes `invoices.customer_id` nullable, changes FK to `ON DELETE SET NULL` |
| `20240101000004_invoice_builder.sql` | Pass 6 | Adds `next_invoice_number` to businesses, unique index on invoice numbers, `create_invoice_with_items` atomic RPC |

---

## 4. Current Routes

### Public routes

| Route | Description |
|-------|-------------|
| `/` | Full marketing website: navbar, hero, invoice preview, features, how it works, AI Quick Invoice, mobile section, CTA, footer |

### Authentication routes

| Route | Description |
|-------|-------------|
| `/auth/login` | Email/password login → redirect to `/dashboard` |
| `/auth/sign-up` | Email/password sign up → redirect to `/auth/sign-up-success` |
| `/auth/signup` | Alias for `/auth/sign-up` |
| `/auth/forgot-password` | Send password reset email |
| `/auth/update-password` | Set new password → redirect to `/auth/login` |
| `/auth/reset-password` | Alias for `/auth/update-password` |
| `/auth/confirm` | Email OTP verification (`token_hash`) |
| `/auth/error` | Friendly auth error display |
| `/auth/sign-up-success` | Confirmation prompt |
| `/auth/logout` | Server-side logout POST |

### Protected application routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Authenticated dashboard with stats, recent invoices, quick actions, getting started |
| `/dashboard/onboarding` | First-time business setup |
| `/customers` | Customer list with search |
| `/customers/new` | Add customer |
| `/customers/[id]` | Customer detail view |
| `/customers/[id]/edit` | Edit customer |
| `/invoices` | Invoice list |
| `/invoices/new` | Create new invoice |
| `/invoices/[id]` | Invoice detail/preview |

### Not yet implemented

| Route | Planned Pass |
|-------|-------------|
| `/settings` | PASS 7+ (business profile editing, settings) |

### Route structure

All app routes under `/dashboard`, `/customers`, and `/invoices` use a shared pattern:
- `layout.tsx` — auth gate (redirect to `/auth/login` if unauthenticated; `/dashboard/onboarding` if no business) + `DashboardShell` wrapper
- `page.tsx` (or `[id]/page.tsx`) — async data fetching with `Suspense` + skeleton fallbacks

---

## 5. Technology Stack

**Frontend:**
- Next.js 16 App Router
- TypeScript (strict mode)
- Tailwind CSS v3.4
- Lucide React icons
- `next-themes` (light/dark/system)
- Radix UI primitives (`@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-slot`)
- `clsx` + `tailwind-merge` (via `@/lib/utils`)
- `class-variance-authority`

**Backend:**
- Supabase Auth
- Supabase PostgreSQL (with Row Level Security)
- Supabase Storage (private bucket)

**Build & deploy:**
- Vite (via Next.js 16 Turbopack)
- Vercel (deployment target)
- npm (package manager)

**No additional dependencies were added beyond the baseline.**

---

## 6. Design System

- **Colors:** Indigo primary (`#4F46E5`), applied strategically for CTAs, active states, and highlights. Neutral whites/slates for surfaces. Full dark mode token set in `app/globals.css`.
- **Typography:** Geist Sans via `next/font/google`. Strong hierarchy, financial numbers highly readable.
- **Icons:** Lucide React only. No emojis in UI.
- **Responsive:** Mobile-first Tailwind classes throughout. Designed for 375px, 390px, 414px, 768px, 1024px, 1440px. Components use responsive grids and transform tables to cards on mobile.
- **Animation:** Subtle only — hover transitions, button transitions, dropdown transitions, skeleton loading. No excessive animation.

### Component structure

```
components/
  ui/           — Shadcn-style foundation primitives
    alert.tsx, avatar.tsx, badge.tsx, button.tsx, card.tsx, checkbox.tsx,
    dropdown-menu.tsx, input.tsx, label.tsx, select.tsx, separator.tsx,
    skeleton.tsx, toast.tsx
  marketing/    — Public website sections
    navbar.tsx, hero-section.tsx, invoice-preview.tsx, features-section.tsx,
    how-it-works.tsx, ai-quick-invoice.tsx, mobile-section.tsx,
    cta-section.tsx, footer.tsx
  dashboard/    — Application shell
    sidebar.tsx, mobile-sidebar.tsx, header.tsx, dashboard-shell.tsx,
    account-menu.tsx, stat-card.tsx, recent-invoices.tsx,
    getting-started.tsx, logo-upload.tsx
  customers/    — Customer management
    customer-list.tsx, customer-form.tsx, customer-detail.tsx
  invoices/     — Invoice management
    invoice-list.tsx, invoice-builder.tsx, invoice-preview.tsx
  auth-forms/   — Authentication forms
    login-form.tsx, sign-up-form.tsx, forgot-password-form.tsx,
    update-password-form.tsx, auth-button.tsx, logout-button.tsx,
    theme-switcher.tsx
```

---

## 7. Database State

All 5 migrations exist in `supabase/migrations/`. The schema is production-ready.

**To activate the database:**
1. Create the `business-logos` bucket in the Supabase Dashboard → Storage → set to **Private**
2. Apply all 5 migrations in order via Supabase Dashboard → SQL Editor → Run (the `supabase` CLI requires Docker + `SUPABASE_ACCESS_TOKEN`)

**Migrations in order:**
1. `20240101000000_init_schema.sql` — Destructive (drops + recreates all tables). Only for fresh databases.
2. `20240101000001_private_storage_rls.sql` — Storage RLS policies.
3. `20240101000002_dashboard_stats_rpc.sql` — Dashboard stats RPC.
4. `20240101000003_customer_deletion_safety.sql` — Customer deletion safety (nullable customer_id, SET NULL).
5. `20240101000004_invoice_builder.sql` — `next_invoice_number` column, unique index, `create_invoice_with_items` RPC.

---

## 8. Known Technical Debt

1. **Business currency in invoice list** — `InvoiceList` hardcodes `NGN` instead of using the business's actual currency. Fix: accept currency prop from server-side business lookup, pass to `InvoiceList` (same pattern as `RecentInvoices`).

2. **Onboarding selects use native `<select>`** — The onboarding page (`app/dashboard/onboarding/page.tsx`) uses native `<select>` for currency, payment terms, and template. These have `bg-transparent text-foreground` which can cause readability issues in dark mode (OS dropdown list renders white-on-white). The invoice builder already has a custom branded `Select` component (`components/ui/select.tsx`) — onboarding should use it for consistency. This requires converting the form to use hidden inputs for the `FormData`-based server action, since the custom `Select` is a controlled React component without native `name` attributes.

3. **`/invoices` page lacks search/filter** — Currently a basic list with no search or filtering. This was intentionally deferred from PASS 6 but is planned for PASS 7.

4. **Customer name truncation** — In `customer-detail.tsx` line 7, the `Customer` import may not include all needed fields. The component appears to handle missing fields with conditional rendering, but a thorough audit is recommended.

5. **No loading state on business fetch redirect** — `/invoices/new` redirects to `/dashboard/onboarding` if no business exists, but there's no loading state between the suspense boundary resolving and the redirect. This is minor.

6. **`getInvoices` duplicates `getRecentInvoices` logic** — Both functions in `app/actions/invoices.ts` and `app/actions/dashboard.ts` perform nearly identical queries. Consider consolidating into a shared utility.

7. **`proxy.ts` middleware only protects `/dashboard` and auth routes** — The proxy redirects all non-public, non-auth routes when no session exists, but the redirect targets `/auth/login`. This works for all current protected routes but may need updating as new routes are added.

---

## 9. Deferred Functionality

The following features are explicitly deferred to future passes:

| Feature | Planned Pass | Reason |
|---------|-------------|--------|
| Invoice editing (draft → sent, update line items, etc.) | PASS 7 | Invoice creation is PASS 6; editing is lifecycle management |
| Invoice status changes (sent, paid, overdue, cancelled) | PASS 7 | Requires status management UI and RPC |
| Invoice deletion | PASS 7 | Lifecycle management |
| Invoice list search, filters, sort | PASS 7 | Management features |
| Sending/invoicing a draft | PASS 7 | Lifecycle transition |
| PDF generation + download | PASS 8 | New feature set |
| Print-friendly invoice layout | PASS 8 | PDF-related |
| Payment integration | PASS 8 | New feature set (complex) |
| Payment reminders/automation | PASS 9 | Automation |
| AI Quick Invoice | PASS 9 | AI feature |
| Invoice memory (frequently used services) | PASS 9 | AI/automation |
| Customer intelligence (total invoiced, paid, outstanding per customer) | PASS 9 | Data enrichment |
| Settings page (`/settings`) | PASS 7+ | Business profile editing UI not yet built |
| Business profile editing | PASS 7+ | Only onboarding (create) exists |
| Loading state audit | PASS 10 | Product polish |
| Accessibility audit | PASS 10 | Product polish |
| Performance audit | PASS 10 | Product polish |

---

## 10. Development Passes — Status

| Pass | Title | Status |
|------|-------|--------|
| **PASS 0** | Foundation | **COMPLETE** |
| **PASS 1** | Marketing Website | **COMPLETE** |
| **PASS 2** | Authentication + Business Onboarding | **COMPLETE** |
| **PASS 3** | Dashboard Foundation + Business Onboarding | **COMPLETE** |
| **PASS 4** | Dashboard Productionization | **COMPLETE** |
| **PASS 5** | Customers | **COMPLETE** |
| **PASS 6** | Invoice Creation | **COMPLETE** |
| **PASS 7** | Invoice Lifecycle + Management | **NEXT** |
| **PASS 8** | PDF + Sharing + Payments | PENDING |
| **PASS 9** | Reminders + Automation + AI | PENDING |
| **PASS 10** | Production Hardening + MVP Launch | PENDING |

---

## 11. PASS 7 — Next Immediate Task

PASS 7 covers Invoice Lifecycle and Management. The following tasks belong in PASS 7:

### Must-do for PASS 7 completeness

- Invoice list search, filter (by status), and sort
- Invoice status transitions: Draft → Sent → Paid / Overdue / Cancelled
- Invoice editing (modify customer, dates, line items, notes, payment info, status)
- Invoice deletion (with confirmation)
- Settings route (`/settings`) — business profile editing page

### Must NOT be done in PASS 7

- PDF generation
- Payment integration
- AI features
- Email sending/sharing

### Before PASS 7

1. Read `AGENTS.md`
2. Read `REMITOVATE_HANDOVER.md`
3. Inspect the existing invoice architecture (`app/actions/invoices.ts`, `components/invoices/`)
4. Apply pending migration to Supabase if not already done
5. Create a PASS 7 implementation plan
6. Ask questions about genuine ambiguities before coding

---

## 12. Important Architectural Decisions

1. **One business per user (MVP)** — The `businesses` table has `user_id` as `UNIQUE`. Multi-business support is intentionally not implemented.

2. **Server-side business ID derivation** — No client-supplied business IDs. Every server action calls `getBusinessId()` which derives the business from `auth.uid()`. This is defense-in-depth alongside RLS.

3. **Atomic invoice creation via RPC** — Invoice + invoice_items are created in a single PostgreSQL function (`create_invoice_with_items`). This guarantees `next_invoice_number` consistency and transactional integrity for line item calculations.

4. **Invoice items stored as computed values** — Line item subtotals, discounts, taxes, and totals are computed in the RPC and stored in `invoice_items`. The client also computes them live for display. Both use the same formula: `subtotal = qty × price`, `discount` depends on type (percentage/fixed), `tax = (subtotal - discount) × tax_rate / 100`, `total = subtotal - discount + tax`.

5. **`next_invoice_number` vs `invoice_start_number`** — `invoice_start_number` is the user-configured starting point (immutable after creation). `next_invoice_number` is the server-managed counter, incremented atomically by the RPC. The invoice number format is `{prefix}-{zero-padded 4-digit number}`.

6. **Custom `Select` component** — Replaced native `<select>` in the invoice builder with a Radix-based custom select (`components/ui/select.tsx`) to fix dark-mode text readability issues. Native selects render OS-controlled dropdown lists that can't respect CSS in dark mode. The onboarding page still uses native selects (known technical debt — see section 8).

7. **FormData vs structured data** — Customers and business onboarding use `FormData`-based server actions. Invoices use a structured data approach (`createInvoice({ customerId, invoiceDate, dueDate, items, ... })`) because of complex nested line item data.

8. **Suspended auth gates** — Protected route layouts use `Suspense` with a spinner fallback around the `UserCheck` async function. This avoids waterfall delays when the auth check is slow.

9. **Proxy middleware approach** — Instead of per-route `redirect()` calls, a root `proxy.ts` middleware refreshes sessions on every request and redirects unauthenticated users globally. This was the original Next.js + Supabase SSR template approach.

10. **Migration approach** — Migrations are designed to be applied manually via Supabase Dashboard SQL Editor (the `supabase` CLI requires Docker). The `init_schema.sql` migration is destructive (drops tables first) and is explicitly marked as "fresh database only."

---

## 13. Current Git History

```
4c8c863  feat: implement invoice creation and preview       ← PASS 6
55294e1  docs: update handover after pass 5                 ← PASS 5
203b106  feat: implement customer management                ← PASS 5
e137097  feat: productionize dashboard with SQL stats, business currency, and dynamic onboarding
a284a83  docs: update project handover after pass 3
3986635  fix: secure business logo storage                  ← PASS 3 fix
7b9dc5d  feat: build dashboard and business onboarding      ← PASS 3
cc92106  docs: update project handover after pass 2
351f83e  feat: implement authentication and theming       ← PASS 2
1c57226  feat: build remitovate marketing website           ← PASS 1
9d5c4ef  docs: add project handover
aa0c4cb  feat: eatablish remitovate foundation                ← PASS 0
e487300  Initial commit from Create Next App
```

---

## 14. Manual Setup Required

1. **Create `.env.local`** from `.env.example` with real Supabase URL and anon key.
2. **Create `business-logos` bucket** in Supabase Dashboard → Storage → set to **Private**.
3. **Apply all 5 migrations** in order via Supabase Dashboard → SQL Editor → Run. The `supabase` CLI requires Docker + `SUPABASE_ACCESS_TOKEN` which may not be available.
4. **Supabase Auth settings** — Configure email confirmations, password reset, and redirect URLs in Supabase Dashboard → Authentication → URL Configuration.
