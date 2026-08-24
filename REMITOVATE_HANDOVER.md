# REMITOVATE — HANDOVER DOCUMENT

## 1. Current Project Status

**Status:** PASS 7 complete. Invoice lifecycle management (edit, status transitions, deletion, search/filter/sort, settings) is fully implemented. Build and TypeScript pass.

**Git state:** Clean working tree (documentation changes only in `AGENTS.md` and `REMITOVATE_HANDOVER.md`). PASS 7 committed as `d8c06ce feat(invoices): complete invoice lifecycle management`.

**Remote:** `origin` → `https://github.com/prosperityadedayo/remitovate.git`

**Supabase project:** `tkulugquyftptpijtske`

**Migration note:** `20240101000005_invoice_lifecycle.sql` is ready in `supabase/migrations/` but must be applied manually to the Supabase database. Without it, `updateInvoice` will fail (RPC does not exist) and dashboard overdue stats will use the old static logic.

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
| `business.ts` | `createBusiness(formData)`, `updateBusiness(formData)` — returns `{success: true} \| {error: string}` | Onboarding form, settings page |
| `customers.ts` | `getCustomers(searchQuery?)`, `getCustomerById(id)`, `createCustomer(formData)`, `updateCustomer(id, formData)`, `deleteCustomer(id)` | Customer pages |
| `invoices.ts` | `getCustomersForInvoice()`, `getBusinessForInvoice()`, `createInvoice(data)`, `updateInvoice(id, data)`, `getInvoiceById(id)`, `getInvoices(params?)`, `updateInvoiceStatus(id, status)`, `deleteInvoice(id)` | Invoice pages |
| `dashboard.ts` | `getBusinessId()` — returns `{id, currency} \| null`, `getDashboardStats()`, `getRecentInvoices()`, `getBusinessSetupStatus()` | Dashboard page, invoice list page |
| `upload.ts` | `getSignedLogoUrl(path)` — returns signed URL (1-year expiry) | Account menu, customer detail, settings page |

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

### Invoices (PASS 6 + PASS 7)

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
- `/invoices` now supports debounced search (URL-synced), status filter dropdown, and sort dropdown
- `/invoices/[id]` detail page shows effective status (including dynamic "overdue"), status transition dropdown, two-step delete confirmation button, and conditional Edit button
- `/invoices/[id]/edit` pre-fills all fields from server data; saves atomically via `update_invoice_with_items` RPC; redirects to detail if invoice is paid or cancelled
- Status transitions: Draft → Sent → Paid / Overdue / Cancelled (validated server-side); Overdue is an effective status computed when `status = 'sent'` and `due_date < today`
- `updateInvoice`, `updateInvoiceStatus`, `deleteInvoice` server actions
- Atomic invoice updates via `update_invoice_with_items` PostgreSQL RPC
- Paid and cancelled invoices are not editable (Edit button hidden; edit page redirects)

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
| `20240101000005_invoice_lifecycle.sql` | Pass 7 | Updates `get_dashboard_stats` RPC (dynamic overdue computation), adds `update_invoice_with_items` RPC |

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
| `/invoices/[id]/edit` | Edit invoice (draft, sent, overdue only; paid/cancelled redirect to detail) |
| `/settings` | Business profile editing |

### Not yet implemented

### Route structure

All app routes under `/dashboard`, `/customers`, `/invoices`, and `/settings` use a shared pattern:
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
    invoice-list.tsx, invoice-builder.tsx, invoice-preview.tsx,
    invoice-status-badge.tsx, invoice-status-actions.tsx,
    invoice-delete-button.tsx
  settings/     — Business settings
    business-form.tsx
  auth-forms/   — Authentication forms
    login-form.tsx, sign-up-form.tsx, forgot-password-form.tsx,
    update-password-form.tsx, auth-button.tsx, logout-button.tsx,
    theme-switcher.tsx
```

---

## 7. Database State

All 6 migrations exist in `supabase/migrations/`. The schema is production-ready.

**To activate the database:**
1. Create the `business-logos` bucket in the Supabase Dashboard → Storage → set to **Private**
2. Apply all 6 migrations in order via Supabase Dashboard → SQL Editor → Run (the `supabase` CLI requires Docker + `SUPABASE_ACCESS_TOKEN`)

**Migrations in order:**
1. `20240101000000_init_schema.sql` — Destructive (drops + recreates all tables). Only for fresh databases.
2. `20240101000001_private_storage_rls.sql` — Storage RLS policies.
3. `20240101000002_dashboard_stats_rpc.sql` — Dashboard stats RPC.
4. `20240101000003_customer_deletion_safety.sql` — Customer deletion safety (nullable customer_id, SET NULL).
5. `20240101000004_invoice_builder.sql` — `next_invoice_number` column, unique index, `create_invoice_with_items` RPC.
6. `20240101000005_invoice_lifecycle.sql` — Updates `get_dashboard_stats` RPC (dynamic overdue), adds `update_invoice_with_items` RPC.

---

## 8. Known Technical Debt

1. **Onboarding selects use native `<select>`** — The onboarding page (`app/dashboard/onboarding/page.tsx`) uses native `<select>` for currency, payment terms, and template. These have `bg-transparent text-foreground` which can cause readability issues in dark mode (OS dropdown list renders white-on-white). The invoice builder already has a custom branded `Select` component (`components/ui/select.tsx`) — onboarding should use it for consistency. This requires converting the form to use hidden inputs for the `FormData`-based server action, since the custom `Select` is a controlled React component without native `name` attributes.

2. **`getInvoices` and `getRecentInvoices` share query logic** — Both functions in `app/actions/invoices.ts` and `app/actions/dashboard.ts` perform nearly identical queries. Consider consolidating into a shared utility.

3. **`proxy.ts` middleware only protects `/dashboard` and auth routes** — The proxy redirects all non-public, non-auth routes when no session exists, but the redirect targets `/auth/login`. This works for all current protected routes but may need updating as new routes are added.

4. **No loading state on business fetch redirect** — `/invoices/new` redirects to `/dashboard/onboarding` if no business exists, but there's no loading state between the suspense boundary resolving and the redirect. This is minor.

5. **`next_invoice_number` not updated on settings change** — If the user changes the invoice start number in `/settings`, `next_invoice_number` is not updated. The counter continues from its current value. This is a pre-existing limitation in `updateBusiness`.

6. **No automated tests** — The project has no test suite (no jest, vitest, or playwright). All validation is via `npm run lint` and `npm run build`. A testing framework is deferred to PASS 10.

---

## 9. Deferred Functionality

The following features are explicitly deferred to future passes:

| Feature | Planned Pass | Reason |
|---------|-------------|--------|
| PDF generation + download | PASS 8 | New feature set — requires PDF library |
| Print-friendly invoice layout | PASS 8 | PDF-related |
| Payment integration | PASS 8 | New feature set (complex, requires payment provider account) |
| Sharing via email link | PASS 8 | Requires email delivery infrastructure |
| Payment reminders/automation | PASS 9 | Automation |
| AI Quick Invoice | PASS 9 | AI feature |
| Invoice memory (frequently used services) | PASS 9 | AI/automation |
| Customer intelligence (total invoiced, paid, outstanding per customer) | PASS 9 | Data enrichment |
| Loading state audit | PASS 10 | Product polish |
| Accessibility audit | PASS 10 | Product polish |
| Performance audit | PASS 10 | Product polish |
| Responsive audit | PASS 10 | Product polish |
| Error handling audit | PASS 10 | Product polish |

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
| **PASS 7** | Invoice Lifecycle + Management | **COMPLETE** |
| **PASS 8** | PDF + Sharing + Payments | PENDING |
| **PASS 9** | Reminders + Automation + AI | PENDING |
| **PASS 10** | Production Hardening + MVP Launch | PENDING |

---

## 11. PASS 7 — Completion Summary

PASS 7 (Invoice Lifecycle + Management) is complete. The following was implemented:

### What was built

- **Invoice list** (`/invoices`) — now supports debounced search (URL-synced), status filter dropdown (all/draft/sent/paid/overdue/cancelled), and sort dropdown (6 options). Currency-aware formatting via business lookup.
- **Invoice status transitions** — dropdown on detail page with server-side validation. Allowed transitions: Draft→Sent, Draft→Cancelled, Sent→Paid, Sent→Cancelled, Paid→Cancelled, Cancelled→Draft (reopen). Overdue is a computed effective status, not a stored one.
- **Invoice editing** (`/invoices/[id]/edit`) — pre-fills customer, dates, line items, notes, payment info from server data. Saves atomically via `update_invoice_with_items` RPC. Redirect guard prevents editing paid/cancelled invoices.
- **Invoice deletion** — two-step confirmation (trash icon → "This cannot be undone" + Delete/Cancel buttons). Server action scoped to business_id; invoice_items cascade-delete via FK.
- **Settings** (`/settings`) — full business profile editing form with logo upload (signed URL preview, real-time crop-to-square), brand colour picker (presets + custom hex), and all business fields.
- **`lib/invoice-utils.ts`** — shared utilities: `getEffectiveStatus`, `getStatusVariant`, `getAvailableTransitions`, `getStatusTransitionLabel`, `formatCurrency`, `formatDate`, `formatDateShort`.
- **New components:** `InvoiceStatusBadge`, `InvoiceStatusActions`, `InvoiceDeleteButton`, `BusinessForm` (settings).
- **Migration:** `20240101000005_invoice_lifecycle.sql` — updates `get_dashboard_stats` RPC (dynamic overdue), adds `update_invoice_with_items` RPC.

### Validation status

- Lint: passes (`node node_modules/eslint/bin/eslint.js .` — no errors)
- Build: passes (`node node_modules/next/dist/bin/next build`)
- TypeScript: strict mode, passes
- Migration: created, NOT yet applied to Supabase (manual step required)

### Key design decisions

1. **Overdue is computed, not stored** — `getEffectiveStatus()` checks `status = 'sent'` and `due_date < today`. The database RPC `get_dashboard_stats` was updated to match (overdue = sent + past due; outstanding = sent + not past due).
2. **Paid/cancelled invoices are not editable** — Edit button is hidden on the detail page, and the edit route redirects to detail if accessed directly. Users must cancel a paid invoice first (paid → cancelled → draft), then edit.
3. **Status transitions are validated server-side** — `updateInvoiceStatus` re-fetches the current invoice, computes effective status, and checks against the transition map. Client-side dropdown only shows allowed transitions as defense-in-depth.
4. **Client-supplied totals are recalculated** — The `update_invoice_with_items` RPC recomputes all item subtotals, discounts, taxes, and invoice totals server-side. Client-side calculations are for live display only.
5. **Invoice numbers are immutable** — The `update_invoice_with_items` RPC does not modify `invoice_number` or `next_invoice_number`. Changing the invoice prefix in settings does not affect existing invoices.

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

11. **Overdue is a computed status** — The `getEffectiveStatus()` function in `lib/invoice-utils.ts` computes "overdue" client-side when `status = 'sent'` and `due_date < today`. The `get_dashboard_stats` RPC was updated (migration 5) to compute overdue server-side the same way. Overdue is never stored as a row-level status. It appears only in display and filtering logic.

12. **Invoice editing is status-gated** — Paid and cancelled invoices are not editable. The Edit button is hidden on the detail page for these statuses. The edit route (`/invoices/[id]/edit`) redirects to the detail page if accessed directly. This prevents accidental modification of closed invoices. Users must cancel a paid invoice first (paid → cancelled → draft) before editing.

13. **Invoice ownership is derived, never trusted** — All server actions call `getBusinessId()` which derives the business from `auth.uid()`. The `update_invoice_with_items` RPC includes `p_business_id` in its WHERE clause (`WHERE id = p_invoice_id AND business_id = p_business_id`), so even if a user manipulates the URL, they can only modify invoices in their own business.

---

## 13. Current Git History

```
d8c06ce  feat(invoices): complete invoice lifecycle management      ← PASS 7
11a71f0  docs: reconcile project roadmap and handover after pass 6
4c8c863  feat: implement invoice creation and preview              ← PASS 6
55294e1  docs: update handover after pass 5                         ← PASS 5
203b106  feat: implement customer management                        ← PASS 5
e137097  feat: productionize dashboard with SQL stats, business currency, and dynamic onboarding
a284a83  docs: update project handover after pass 3
3986635  fix: secure business logo storage                          ← PASS 3 fix
7b9dc5d  feat: build dashboard and business onboarding              ← PASS 3
cc92106  docs: update project handover after pass 2
351f83e  feat: implement authentication and theming               ← PASS 2
1c57226  feat: build remitovate marketing website                   ← PASS 1
9d5c4ef  docs: add project handover
aa0c4cb  feat: eatablish remitovate foundation                        ← PASS 0
e487300  Initial commit from Create Next App
```

---

## 14. PASS 8 — Next Immediate Task

PASS 8 covers PDF generation, invoice sharing, and payment integration.

### Must-do for PASS 8

- Professional invoice PDF generation (server-side rendering to PDF)
- PDF download button on invoice detail page
- Print-friendly layout (CSS print media queries)
- Public/customer-facing invoice access (shareable link with invoice token)
- Payment integration (Stripe or equivalent — check for free tier)
- Payment success/failure handling
- Payment status synchronization (update invoice status to "paid" when payment succeeds)

### Must NOT be done in PASS 8

- Automated payment reminders
- AI invoice generation
- AI assistants
- Complex accounting
- Analytics
- Subscriptions
- Team collaboration
- General settings redesign (already built in PASS 7)

### Before PASS 8

1. Read `AGENTS.md`
2. Read `REMITOVATE_HANDOVER.md`
3. Apply migration `20240101000005_invoice_lifecycle.sql` to Supabase
4. Decide on PDF generation library (research options compatible with Next.js + Vercel free tier)
5. Decide on payment provider (Stripe, PayPal, etc.)
6. Create a PASS 8 implementation plan

---

## 15. Production-Readiness Considerations

The following areas have NOT been audited yet (planned for PASS 10):

| Area | Current State | Notes |
|------|--------------|-------|
| Loading states | Partially implemented | Skeleton loaders on invoices, customers, dashboard. Some edge cases may lack loading states. |
| Error handling | Basic | Server actions return `{error: string}`. No centralized error boundary for unexpected exceptions. |
| Empty states | Implemented | Invoice list, customer list, recent invoices all have empty states. |
| Responsive | Implemented | Mobile-first Tailwind classes throughout. Tables transform to cards on mobile. |
| Accessibility | Not audited | No axe-core or automated a11y testing. Manual review needed. |
| Performance | Not audited | No Lighthouse audit, no React Profiler runs. Build is optimized but runtime performance not measured. |
| Security review | Partial | RLS is in place. No explicit security penetration test. RPC functions rely on RLS for access control. |
| Rate limiting | Not implemented | No rate limits on auth endpoints or server actions. |
| Email delivery | Uses Supabase defaults | No custom email templates or delivery provider configured. |
| Invoice numbering concurrency | Atomic via RPC | `next_invoice_number` is incremented inside a PostgreSQL transaction (the RPC). Safe under concurrent requests. |
| RPC security | Relies on RLS | RPC functions use `SECURITY DEFINER` or `SECURITY INVOKER`? Check actual function definitions. The `get_dashboard_stats` function uses `STABLE` volatility and relies on RLS for row-level access. |

---

## 16. Manual Setup Required

1. **Create `.env.local`** from `.env.example` with real Supabase URL and anon key.
2. **Create `business-logos` bucket** in Supabase Dashboard → Storage → set to **Private**.
3. **Apply all 6 migrations** in order via Supabase Dashboard → SQL Editor → Run. The `supabase` CLI requires Docker + `SUPABASE_ACCESS_TOKEN` which may not be available.
   - Migration 5 (`20240101000005_invoice_lifecycle.sql`) updates the `get_dashboard_stats` RPC and adds the `update_invoice_with_items` RPC. This must be applied for invoice editing and accurate dashboard overdue stats to work.
4. **Supabase Auth settings** — Configure email confirmations, password reset, and redirect URLs in Supabase Dashboard → Authentication → URL Configuration.

## Current Next Action

**PASS 8:** Apply migration `20240101000005_invoice_lifecycle.sql` to Supabase (required for `updateInvoice`, `updateInvoiceStatus`, and accurate dashboard stats). Then begin PASS 8 (PDF generation + payment integration).
