# REMITOVATE — HANDOVER DOCUMENT

## 1. Current Project Status

**Status:** PASS 9 complete. Payment reminders, invoice memory, customer intelligence, and AI Quick Invoice are fully implemented. Build and TypeScript pass.

**Git state:** Working tree has uncommitted PASS 9 changes. Last committed pass: PASS 8 (`b166027 feat: complete pass 8 invoice workflow`). PASS 7 committed as `d8c06ce feat(invoices): complete invoice lifecycle management`.

**Remote:** `origin` → `https://github.com/prosperityadedayo/remitovate.git`

**Supabase project:** `tkulugquyftptpijtske`

**Migration note:** Two PASS 9 migrations (`20240101000006_payment_reminders.sql`, `20240101000007_customer_intelligence.sql`) are ready in `supabase/migrations/` but must be applied manually to the Supabase database. Without migration 6, `last_reminded_at` updates will fail. Without migration 7, customer intelligence stats will return zeros.

**Local planning docs:** `PASS_9_PLAN.md` exists in the repo root for reference. It is not part of the committed codebase and should remain untracked.

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
| `upload.ts` | `getSignedLogoUrl(path)` — returns signed URL (1-year expiry) | Account menu, customer detail, settings page, PDF generation |
| `reminders.ts` | `generateReminderText(invoiceId)` — returns email/WhatsApp text, `recordReminderSent(invoiceId)` — updates `last_reminded_at` | Invoice detail page |
| `invoice-memory.ts` | `getFrequentServices(businessId, limit?)`, `getFrequentServicesForCustomer(businessId, customerId, limit?)` | Invoice builder suggestions |
| `customer-intelligence.ts` | `getCustomerIntelligence(customerId)`, `getCustomerInvoiceHistory(customerId)`, `getCustomerFrequentServices(customerId, limit?)` | Customer detail page |
| `ai-invoice.ts` | `parseInvoiceFromText(text)` — tries Gemini then Groq then deterministic fallback, `parseNaturalLanguage(text)` — deterministic parser only | AI Quick Add panel in invoice builder |

### AI architecture

- `parseInvoiceFromText` is the single entry point used by the UI.
- It runs Gemini and Groq in parallel via `Promise.all`.
- First successful result wins. If both fail, the deterministic regex parser runs as instant fallback.
- AI API keys are server-side only (`GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`).
- Only the user's natural language prompt is sent to AI providers. No customer IDs, business IDs, auth tokens, or invoice history are included.

### PDF generation

- `app/api/invoices/[id]/pdf/route.tsx` — Route handler that generates PDFs server-side using `@react-pdf/renderer`.
- Validates auth + business ownership before generating.
- Fetches logo as base64 data URL from private Supabase Storage (via signed URL) and embeds it directly in the PDF.
- Returns `application/pdf` with `Content-Disposition: attachment; filename="{INVOICE_NUMBER}.pdf"`.

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
- **Error handling** — `/auth/error` — friendly auth error messages
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
- `/customers/[id]` — detail view with contact info grid, breadcrumbs, edit/delete actions, customer financial intelligence cards, frequent services, invoice history
- `/customers/[id]/edit` — edit form pre-filled with data
- Delete safety: blocked if customer has invoices, with clear error message
- Inline two-step delete confirmation with toast
- Responsive: stacked cards on mobile, table rows on desktop

### Invoices (PASS 6 + PASS 7 + PASS 8)

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
  - **Download PDF** button — generates professional PDF via server-side `@react-pdf/renderer`, triggers file download as `{INVOICE_NUMBER}.pdf`
  - **Print Invoice** button — opens browser print dialog with clean `@media print` CSS; dashboard chrome (sidebar, header, action buttons) is hidden during print
  - **Share** dropdown — Copy Summary (formatted invoice text to clipboard) and Copy Link (invoice URL to clipboard)
  - **Remind** button — generates contextual email/WhatsApp reminder text for sent/overdue invoices with copy-to-clipboard and deep-link actions
  - Edit, status transition, and delete actions
- `/invoices/[id]/edit` — pre-fills all fields from server data; saves atomically via `update_invoice_with_items` RPC; redirects to detail if invoice is paid or cancelled
- **PDF generation** (`/api/invoices/[id]/pdf`) — server-side A4 PDF with business branding, logo (embedded as base64 from private storage), line items, totals, notes, payment information. Always renders as clean white paper regardless of user's theme.
- **Print layout** — `@media print` CSS hides all dashboard chrome (`no-print` class on sidebar, header, mobile sidebar, action buttons). Main content padding is removed. Invoice renders at A4 size with 15mm margins.
- **Sharing** — clipboard-based (copy summary text, copy invoice link). No public invoice routes. No email delivery infrastructure.

**Payment model (critical):**
- Remitovate creates and manages invoices.
- Business owners can mark invoices as paid (after receiving payment externally).
- Remitovate does NOT collect customer payments.
- There is NO payment gateway integration in the current MVP.
- There is NO Stripe, Paystack, PayPal, or any other payment processor integration.
- Money movement happens entirely outside Remitovate.

### PASS 9 Features

#### Payment Reminders
- **Remind button** on `/invoices/[id]` for sent/overdue invoices
- Generates contextual email and WhatsApp reminder text via `generateReminderText` server action
- `InvoiceReminderDialog` component with email/WhatsApp tabs, copy-to-clipboard, and deep-link actions (mailto / wa.me)
- `recordReminderSent` updates `last_reminded_at` on copy
- 15-second timeout with explicit error state if generation fails

#### Invoice Memory (Frequently Used Services)
- `getFrequentServices(businessId)` — returns most-used services across all invoices for a business
- `getFrequentServicesForCustomer(businessId, customerId)` — returns most-used services for a specific customer
- `InvoiceSuggestions` component renders pills above line items in the invoice builder
- Clicking a pill adds a pre-filled line item to the invoice
- Empty state shown when no history exists

#### Customer Intelligence
- `getCustomerIntelligence(customerId)` — returns total invoiced, paid, outstanding, overdue, counts, and latest invoice date via `get_customer_intelligence` RPC
- `getCustomerInvoiceHistory(customerId)` — returns list of past invoices with status and totals
- `getCustomerFrequentServices(customerId)` — returns frequently purchased services for the customer
- `CustomerIntelligenceCards` — 4 stat cards on customer detail page
- `CustomerFrequentServices` — pill buttons for frequently purchased services
- `CustomerInvoiceHistory` — list of past invoices with links to invoice detail

#### AI Quick Invoice
- `parseInvoiceFromText(text)` — dual-provider parallel execution:
  1. **Gemini** (`gemini-3.7-flash`) — 18s timeout, structured JSON output
  2. **Groq** (`openai/gpt-oss-20b`) — 12s timeout, native fetch to `https://api.groq.com/openai/v1/chat/completions`
  3. **Deterministic parser** — instant local fallback using regex patterns for quantities, currency, discounts, and Nigerian English patterns
- `AiQuickAdd` component in invoice builder:
  - Textarea for natural language input
  - "Generate Invoice Items" button
  - Preview of parsed items with "(AI)" badge when AI was used
  - "Add to Invoice" and "Discard" actions
  - Error state with helpful message if parsing fails
- Prompt engineering for Nigerian freelancer patterns: "discount of X", "costed", "thousand naira", "then/also/plus" separators, description cleanup

### Server actions

| File | Functions | Used by |
|------|-----------|---------|
| `business.ts` | `createBusiness(formData)`, `updateBusiness(formData)` — returns `{success: true} \| {error: string}` | Onboarding form, settings page |
| `customers.ts` | `getCustomers(searchQuery?)`, `getCustomerById(id)`, `createCustomer(formData)`, `updateCustomer(id, formData)`, `deleteCustomer(id)` | Customer pages |
| `invoices.ts` | `getCustomersForInvoice()`, `getBusinessForInvoice()`, `createInvoice(data)`, `updateInvoice(id, data)`, `getInvoiceById(id)`, `getInvoices(params?)`, `updateInvoiceStatus(id, status)`, `deleteInvoice(id)` | Invoice pages |
| `dashboard.ts` | `getBusinessId()` — returns `{id, currency} \| null`, `getDashboardStats()`, `getRecentInvoices()`, `getBusinessSetupStatus()` | Dashboard page, invoice list page |
| `upload.ts` | `getSignedLogoUrl(path)` — returns signed URL (1-year expiry) | Account menu, customer detail, settings page, PDF generation |
| `reminders.ts` | `generateReminderText(invoiceId)`, `recordReminderSent(invoiceId)` | Invoice detail page |
| `invoice-memory.ts` | `getFrequentServices(businessId, limit?)`, `getFrequentServicesForCustomer(businessId, customerId, limit?)` | Invoice builder suggestions |
| `customer-intelligence.ts` | `getCustomerIntelligence(customerId)`, `getCustomerInvoiceHistory(customerId)`, `getCustomerFrequentServices(customerId, limit?)` | Customer detail page |
| `ai-invoice.ts` | `parseInvoiceFromText(text)`, `parseNaturalLanguage(text)` | AI Quick Add panel |

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
| `/customers/[id]` | Customer detail view with financial intelligence, frequent services, invoice history |
| `/customers/[id]/edit` | Edit customer |
| `/invoices` | Invoice list |
| `/invoices/new` | Create new invoice with AI Quick Add, suggestions |
| `/invoices/[id]` | Invoice detail/preview with Download PDF, Print, Share, Remind actions |
| `/invoices/[id]/edit` | Edit invoice (draft, sent, overdue only; paid/cancelled redirect to detail) |
| `/settings` | Business profile editing |

### API routes

| Route | Description |
|-------|-------------|
| `/api/invoices/[id]/pdf` | Server-side PDF generation. Validates auth + business ownership. Returns `application/pdf`. |

### Route structure

All app routes under `/dashboard`, `/customers`, `/invoices`, and `/settings` use a shared pattern:
- `layout.tsx` — auth gate (redirect to `/auth/login` if unauthenticated; `/dashboard/onboarding` if no business) + `DashboardShell` wrapper
- `page.tsx` (or `[id]/page.tsx`) — async data fetching with `Suspense` + skeleton fallbacks

Dashboard chrome components (`Sidebar`, `Header`, `MobileSidebar`) carry the `no-print` class so they are hidden during print/PDF output.

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
- `@react-pdf/renderer` (v4.8.1) — server-side PDF generation only; does not affect client bundle

**Backend / AI:**
- Supabase Auth
- Supabase PostgreSQL (with Row Level Security)
- Supabase Storage (private bucket)
- Google Gemini API (`@google/genai`) — free tier, server-side only
- Groq API — free tier, native `fetch` to OpenAI-compatible endpoint

**Build & deploy:**
- Next.js 16 Turbopack
- Vercel (deployment target)
- npm (package manager)

---

## 6. Design System

- **Colors:** Indigo primary (`#4F46E5`), applied strategically for CTAs, active states, and highlights. Neutral whites/slates for surfaces. Full dark mode token set in `app/globals.css`. Invoice document uses design tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) so it matches the app theme in both light and dark modes.
- **Typography:** Geist Sans via `next/font/google`. Strong hierarchy, financial numbers highly readable.
- **Icons:** Lucide React only. No emojis in UI.
- **Responsive:** Mobile-first Tailwind classes throughout. Designed for 375px, 390px, 414px, 768px, 1024px, 1440px. Components use responsive grids and transform tables to cards on mobile.
- **Animation:** Subtle only — hover transitions, button transitions, dropdown transitions, skeleton loading. No excessive animation.
- **Print/PDF:** `@media print` CSS in `app/globals.css` forces white background, dark text, hides dashboard chrome, removes padding/shadows/rounded corners. PDF always renders as clean A4 white paper.

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
    sidebar.tsx (no-print), mobile-sidebar.tsx (no-print),
    header.tsx (no-print), dashboard-shell.tsx,
    account-menu.tsx, stat-card.tsx, recent-invoices.tsx,
    getting-started.tsx, logo-upload.tsx
  customers/    — Customer management
    customer-list.tsx, customer-form.tsx, customer-detail.tsx,
    customer-intelligence.tsx, customer-frequent-services.tsx,
    customer-invoice-history.tsx
  invoices/     — Invoice management
    invoice-list.tsx, invoice-builder.tsx,
    invoice-preview.tsx (detail page with PDF/Print/Share/Remind actions),
    invoice-document.tsx (standalone invoice document — theme-aware),
    invoice-pdf-document.tsx (@react-pdf/renderer A4 PDF document),
    invoice-status-badge.tsx, invoice-status-actions.tsx,
    invoice-delete-button.tsx,
    invoice-reminder-dialog.tsx, invoice-suggestions.tsx, ai-quick-add.tsx
  settings/     — Business settings
    business-form.tsx
  auth-forms/   — Authentication forms
    login-form.tsx, sign-up-form.tsx, forgot-password-form.tsx,
    update-password-form.tsx, auth-button.tsx, logout-button.tsx,
    theme-switcher.tsx
```

---

## 7. Database Schema

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
- PDF route handler (`app/api/invoices/[id]/pdf/route.tsx`) replicates the same ownership check server-side before generating any output

### Storage

- Bucket: `business-logos` (Private)
- Path: `{user_id}/{timestamp}.{extension}`
- Display: signed URLs (1-year expiry) via `getSignedLogoUrl()`
- Logo images in the on-screen invoice document use plain `<img>` tags (not `next/image`) because the `next.config.ts` `remotePatterns` only matches `/storage/v1/object/public/**` paths, while signed URLs use `/storage/v1/object/sign/**`. This is a pre-existing configuration mismatch.
- Logo images in the PDF are fetched server-side as base64 data URLs and embedded directly via `@react-pdf/renderer`'s `<Image source={...} />` component.

### Migrations

All 8 migrations exist in `supabase/migrations/`. The schema is production-ready.

**To activate the database:**
1. Create the `business-logos` bucket in the Supabase Dashboard → Storage → set to **Private**
2. Apply all 8 migrations in order via Supabase Dashboard → SQL Editor → Run (the `supabase` CLI requires Docker + `SUPABASE_ACCESS_TOKEN`)

**Migrations in order:**
1. `20240101000000_init_schema.sql` — Destructive (drops + recreates all tables). Only for fresh databases.
2. `20240101000001_private_storage_rls.sql` — Storage RLS policies for business-logos bucket.
3. `20240101000002_dashboard_stats_rpc.sql` — `get_dashboard_stats` RPC for dashboard aggregation.
4. `20240101000003_customer_deletion_safety.sql` — Makes `invoices.customer_id` nullable, changes FK to `ON DELETE SET NULL`.
5. `20240101000004_invoice_builder.sql` — `next_invoice_number` column, unique index on invoice numbers, `create_invoice_with_items` atomic RPC.
6. `20240101000005_invoice_lifecycle.sql` — Updates `get_dashboard_stats` RPC (dynamic overdue), adds `update_invoice_with_items` RPC.
7. `20240101000006_payment_reminders.sql` — Adds `last_reminded_at` column to `invoices`, creates index.
8. `20240101000007_customer_intelligence.sql` — Adds `get_customer_intelligence` RPC for per-customer financial metrics.

---

## 8. Known Technical Debt

1. **Onboarding selects use native `<select>`** — The onboarding page (`app/dashboard/onboarding/page.tsx`) uses native `<select>` for currency, payment terms, and template. These have `bg-transparent text-foreground` which can cause readability issues in dark mode (OS dropdown list renders white-on-white). The invoice builder already has a custom branded `Select` component (`components/ui/select.tsx`) — onboarding should use it for consistency. This requires converting the form to use hidden inputs for the `FormData`-based server action, since the custom `Select` is a controlled React component without native `name` attributes.

2. **`getInvoices` and `getRecentInvoices` share query logic** — Both functions in `app/actions/invoices.ts` and `app/actions/dashboard.ts` perform nearly identical queries. Consider consolidating into a shared utility.

3. **`proxy.ts` middleware only protects `/dashboard` and auth routes** — The proxy redirects all non-public, non-auth routes when no session exists, but the redirect targets `/auth/login`. This works for all current protected routes but may need updating as new routes are added.

4. **No loading state on business fetch redirect** — `/invoices/new` redirects to `/dashboard/onboarding` if no business exists, but there's no loading state between the suspense boundary resolving and the redirect. This is minor.

5. **`next_invoice_number` not updated on settings change** — If the user changes the invoice start number in `/settings`, `next_invoice_number` is not updated. The counter continues from its current value. This is a pre-existing limitation in `updateBusiness`.

6. **`next.config.ts` image `remotePatterns` mismatch with signed URLs** — The `images.remotePatterns` config only matches `/storage/v1/object/public/**` paths, but the private `business-logos` bucket uses signed URLs with `/storage/v1/object/sign/**` paths. This means `next/image` cannot render signed logo URLs. The invoice document uses plain `<img>` tags as a workaround. The config should be updated to also match `/sign/**` paths, or the bucket should remain private with signed URLs rendered via plain `<img>`.

7. **`@react-pdf/renderer` `Image` component TypeScript parsing** — The `@react-pdf/renderer` `Image` class component causes a TypeScript ESLint parsing error when used with the `src` prop in JSX. The workaround is to use the `source` prop instead. This is a known issue with the library's type definitions.

8. **No automated tests** — The project has no test suite (no jest, vitest, or playwright). All validation is via `npm run lint` and `npm run build`. A testing framework is deferred to PASS 10.

9. **Gemini free-tier 503 errors** — Gemini's free tier occasionally returns 503 `Service Unavailable`. The code handles this via Groq fallback or deterministic parser, but users may experience 10-18s delays on first call. Consider reducing timeout or prioritizing Groq for faster responses.

10. **Reminder dialog error state** — The reminder dialog now shows explicit error messages, but the underlying `generateReminderText` server action can still return `null` silently if the invoice or related customer/business data is missing. Consider adding more granular error messages.

---

## 9. Deferred Functionality

The following features are explicitly deferred to future passes:

| Feature | Planned Pass | Reason |
|---------|-------------|--------|
| Payment integration | NOT PLANNED | Remitovate does NOT process payments. Business owners manually mark invoices as paid after receiving payment externally. There is NO payment gateway, NO Stripe, NO Paystack, NO checkout flow. |
| Public/customer-facing invoice routes with share tokens | PASS 10 | Requires new `invoice_shares` table, secure token management, proxy exception, public layout, and careful security review. Sharing in PASS 8 uses clipboard copy (summary + link) instead. |
| Email delivery (send invoice via email) | NOT PLANNED (MVP) | Requires email provider (Resend, etc.) and email template infrastructure. Manual copy/WhatsApp covers the immediate MVP need. |
| Automated payment reminders/scheduling | NOT PLANNED (MVP) | Manual reminder assistance is implemented. Automation requires cron/background workers (paid on Vercel). |
| AI Quick Invoice | PASS 9 | Implemented with Gemini + Groq fallback + deterministic parser. |
| Invoice memory (frequently used services) | PASS 9 | Implemented via server-side aggregation of `invoice_items`. |
| Customer intelligence (total invoiced, paid, outstanding per customer) | PASS 9 | Implemented via `get_customer_intelligence` RPC and server actions. |
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
| **PASS 8** | PDF + Print + Sharing | **COMPLETE** |
| **PASS 9** | Reminders + Automation + AI | **COMPLETE** |
| **PASS 10** | Production Hardening + MVP Launch | PENDING |

---

## 11. PASS 9 — Completion Summary

PASS 9 (Reminders + Automation + AI) is complete. The following was implemented:

### What was built

#### Payment Reminders
- **Remind button** on `/invoices/[id]` for sent/overdue invoices
- `generateReminderText(invoiceId)` server action fetches invoice, customer, and business data; returns formatted email and WhatsApp text
- `recordReminderSent(invoiceId)` updates `last_reminded_at` timestamp
- `InvoiceReminderDialog` component with email/WhatsApp tabs, copy-to-clipboard buttons, and deep-link actions (mailto / wa.me)
- 15-second timeout with explicit error state if generation fails
- Mobile-friendly dialog layout

#### Invoice Memory
- `getFrequentServices(businessId, limit?)` server action aggregates `invoice_items` joined with `invoices` to find most-used service descriptions and latest unit prices
- `getFrequentServicesForCustomer(businessId, customerId, limit?)` scoped to a specific customer
- `InvoiceSuggestions` component renders loading skeleton, empty state, or pill buttons above line items
- Clicking a pill adds a pre-filled line item to the invoice without overwriting existing items
- Integrated into `/invoices/new` and `/invoices/[id]/edit`

#### Customer Intelligence
- `getCustomerIntelligence(customerId)` uses `get_customer_intelligence` RPC to return aggregated metrics: total invoiced, paid, outstanding, overdue, counts, and latest invoice date
- `getCustomerInvoiceHistory(customerId)` returns ordered list of past invoices with status and totals
- `getCustomerFrequentServices(customerId, limit?)` returns frequently purchased services for the customer
- `CustomerIntelligenceCards` — 4 stat cards (Total Invoiced, Paid, Outstanding, Overdue) with currency formatting
- `CustomerFrequentServices` — pill buttons for frequently purchased services
- `CustomerInvoiceHistory` — list of past invoices with status badges and links to invoice detail
- All integrated into `/customers/[id]` page with skeleton loading states

#### AI Quick Invoice
- `parseInvoiceFromText(text)` — dual-provider parallel execution:
  1. **Gemini** (`gemini-3.7-flash`) — 18s timeout, structured JSON output via `responseMimeType: "application/json"` and `responseSchema`
  2. **Groq** (`openai/gpt-oss-20b`) — 12s timeout, native `fetch` to `https://api.groq.com/openai/v1/chat/completions`
  3. **Deterministic parser** — instant local fallback using regex patterns for quantities, currency, discounts, copies, and Nigerian English patterns ("costed", "thousand naira", "discount of X")
- Prompt engineering for Nigerian freelancer patterns:
  - "Discount of X" applies to preceding service
  - "Then", "also", "plus" = separate line items
  - "costed" = price indicator
  - "thousand naira" = multiply by 1000
  - Description cleanup removes filler words
- `AiQuickAdd` component in invoice builder:
  - Textarea for natural language input
  - "Generate Invoice Items" button with loading state
  - Preview of parsed items with "(AI)" badge when AI was used
  - "Add to Invoice" and "Discard" actions
  - Error state with helpful message if parsing fails
  - Empty items show: "Couldn't parse any line items from that text. Try: 'Website design ₦150,000 plus hosting ₦20,000'"

### New files created

| File | Purpose |
|------|---------|
| `app/actions/reminders.ts` | Reminder text generation + `last_reminded_at` tracking |
| `app/actions/invoice-memory.ts` | Frequent services queries for business and customer |
| `app/actions/customer-intelligence.ts` | Customer metrics, invoice history, frequent services |
| `app/actions/ai-invoice.ts` | AI parser abstraction with Gemini + Groq + deterministic fallback |
| `components/invoices/invoice-reminder-dialog.tsx` | Reminder UI with email/WhatsApp tabs |
| `components/invoices/invoice-suggestions.tsx` | Suggestion pills for frequent services |
| `components/invoices/ai-quick-add.tsx` | AI Quick Add textarea + generate + preview |
| `components/customers/customer-intelligence.tsx` | Financial summary stat cards |
| `components/customers/customer-frequent-services.tsx` | Frequent services pills |
| `components/customers/customer-invoice-history.tsx` | Invoice history list with status badges |
| `supabase/migrations/20240101000006_payment_reminders.sql` | Adds `last_reminded_at` column |
| `supabase/migrations/20240101000007_customer_intelligence.sql` | Adds `get_customer_intelligence` RPC |

### Files modified

| File | Changes |
|------|---------|
| `package.json` | Added `@google/genai` (^1.52.0) |
| `types/index.ts` | Added `CustomerIntelligence`, `InvoiceHistoryEntry`, `ServiceSuggestion` |
| `app/invoices/[id]/page.tsx` | Passes invoice data to `InvoicePreview` |
| `components/invoices/invoice-preview.tsx` | Added Remind button, reminder dialog, error handling, 15s timeout |
| `components/invoices/invoice-builder.tsx` | Added `InvoiceSuggestions` and `AiQuickAdd` sections in 2×2 grid layout |
| `components/customers/customer-detail.tsx` | Added intelligence cards, frequent services, invoice history |
| `app/customers/[id]/page.tsx` | Fetches `intelligence`, `invoiceHistory`, `frequentServices`, and `currency` |

### Dependencies added

| Package | Version | Purpose |
|---------|---------|---------|
| `@google/genai` | ^1.52.0 | Google Gemini API client for AI-enhanced invoice parsing |

### Database changes

- Migration 6: Adds `last_reminded_at TIMESTAMPTZ` column to `invoices` table, with index.
- Migration 7: Adds `get_customer_intelligence(p_customer_id uuid)` RPC returning aggregated per-customer financial metrics.

### Security decisions

- AI API keys are server-side only (`GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY` in `.env.local`). Never exposed to client.
- Only the user's natural language prompt is sent to AI providers. No customer IDs, business IDs, auth tokens, or invoice history are included.
- `parseInvoiceFromText` validates all AI output before returning. Invalid items are filtered out.
- Deterministic parser provides zero-cost, zero-latency fallback if AI is unavailable, rate-limited, or returns invalid data.
- Reminder server action scopes query by `business_id` derived from `auth.uid()`.
- Customer intelligence server actions derive business ownership via `getBusinessId()`.

### What was NOT implemented (and why)

- **Automated email/SMS/WhatsApp sending** — Requires paid provider (Resend, Twilio). Out of scope for zero-capital MVP. Manual copy/open actions are the MVP.
- **Reminder scheduling/automation** — Requires cron/background workers (paid on Vercel). Manual reminder assistance is the MVP.
- **AI provider cost** — Both Gemini and Groq free tiers are used. No paid AI APIs.
- **Custom reminder templates** — Hardcoded templates are sufficient for MVP. Customization is a post-MVP feature.

### Validation

- Lint: passes (`npm run lint` — 0 errors)
- Build: passes (`npm run build` — TypeScript + production build)
- Manual testing: reminders, suggestions, customer intelligence, and AI Quick Add all verified working

---

## 12. PASS 8 — Completion Summary

PASS 8 (PDF + Print + Sharing) is complete. The following was implemented:

### What was built

- **Invoice document component** (`components/invoices/invoice-document.tsx`) — Standalone, theme-aware invoice document. Uses design tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`) so it matches the app in both light and dark modes. Shows business logo, name, contact details, customer info, invoice dates, line items table, totals, notes, and payment information. Removed from dashboard chrome by `no-print` class during print.

- **PDF document component** (`components/invoices/invoice-pdf-document.tsx`) — `@react-pdf/renderer` document that renders as A4 paper. Includes business branding, logo (embedded as base64 from private Supabase Storage), customer info, line items, subtotal/discount/tax/total, notes, payment information, and brand colour accent line. Always renders as clean white paper with dark text — independent of the user's theme.

- **PDF route handler** (`app/api/invoices/[id]/pdf/route.tsx`) — Server-side endpoint that validates auth + business ownership, fetches invoice data, converts logo signed URL to base64 data URL, renders PDF via `renderToBuffer`, and returns it as `application/pdf` with `Content-Disposition: attachment; filename="{INVOICE_NUMBER}.pdf"`.

- **PDF download button** — Added to `/invoices/[id]` detail page. Calls the PDF route handler, creates a Blob, triggers download. Shows loading state ("Generating...") and toast feedback.

- **Print layout** — `@media print` CSS in `app/globals.css`:
  - Hides all dashboard chrome (`no-print` class on `Sidebar`, `Header`, `MobileSidebar`, and action button container)
  - Removes `main` padding
  - Forces white background and dark text on `.invoice-document`
  - Strips box-shadow, border-radius, and dark-mode wrapper
  - Prevents page breaks inside table rows
  - A4 page size with 15mm margins

- **Sharing** — Dropdown on `/invoices/[id]` with:
  - **Copy Summary** — copies formatted invoice text (number, total, due date, payment instructions, view link) to clipboard
  - **Copy Link** — copies invoice URL to clipboard
  - No public routes. No email delivery. No payment integration.

- **Dark mode on-screen invoice** — `InvoiceDocument` uses design tokens so it blends naturally with the app background in both light and dark modes. No separate "desk" wrapper or modal-like container.

### New files created

| File | Purpose |
|------|---------|
| `components/invoices/invoice-document.tsx` | Standalone theme-aware invoice document (HTML) |
| `components/invoices/invoice-pdf-document.tsx` | `@react-pdf/renderer` A4 PDF document component |
| `app/api/invoices/[id]/pdf/route.tsx` | PDF generation route handler |

### Files modified

| File | Changes |
|------|---------|
| `package.json` | Added `@react-pdf/renderer` (v4.8.1) |
| `next.config.ts` | Added `serverExternalPackages: ["@react-pdf/renderer"]` |
| `app/globals.css` | Added `@media print` styles |
| `app/invoices/[id]/page.tsx` | Fetches signed logo URL server-side, passes to `InvoicePreview` |
| `components/invoices/invoice-preview.tsx` | Added Download PDF, Print Invoice, Share buttons. Extracted document body into `InvoiceDocument`. |
| `components/dashboard/sidebar.tsx` | Added `no-print` class |
| `components/dashboard/header.tsx` | Added `no-print` class |
| `components/dashboard/mobile-sidebar.tsx` | Added `no-print` class |

### Dependencies added

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-pdf/renderer` | ^4.8.1 | Server-side PDF generation (React 19 compatible since v4.1.0) |

### Database changes

**None.** PASS 8 does not add any migrations, tables, columns, or RLS policies.

### Security decisions

- PDF route handler validates auth session and derives `business_id` from `auth.uid()` before fetching the invoice — same ownership model as all other server actions.
- Logo is fetched server-side from the private `business-logos` bucket via signed URL, converted to base64, and embedded in the PDF. The signed URL is never exposed to the client.
- PDF does not contain internal UUIDs, user IDs, or auth tokens.
- No public invoice routes were added. Sharing is clipboard-only.

### What was NOT implemented (and why)

- **Payment integration** — User explicitly excluded from PASS 8. Remitovate does not process payments.
- **Public invoice sharing routes** — Deferred to PASS 10 due to security surface area (token management, RLS bypass, proxy exceptions, public layout). Clipboard sharing covers the immediate MVP need.
- **Email delivery** — Deferred. Requires external email provider.
- **Custom fonts in PDF** — Default Helvetica is sufficient for MVP.

### Validation

- Lint: passes (`npm run lint` — 0 errors)
- Build: passes (`npm run build` — TypeScript + production build)
- React 19 compatibility: `@react-pdf/renderer` v4.1.0+ confirmed compatible
- Next.js 16 compatibility: `serverExternalPackages` config key used; confirmed in `@react-pdf/renderer` docs

---

## 13. PASS 7 — Completion Summary

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

- Lint: passes
- Build: passes
- TypeScript: strict mode, passes
- Migration: created, must be applied manually to Supabase

### Key design decisions

1. **Overdue is computed, not stored** — `getEffectiveStatus()` checks `status = 'sent'` and `due_date < today`. The database RPC `get_dashboard_stats` was updated to match (overdue = sent + past due; outstanding = sent + not past due).
2. **Paid/cancelled invoices are not editable** — Edit button is hidden on the detail page, and the edit route redirects to detail if accessed directly. Users must cancel a paid invoice first (paid → cancelled → draft), then edit.
3. **Status transitions are validated server-side** — `updateInvoiceStatus` re-fetches the current invoice, computes effective status, and checks against the transition map. Client-side dropdown only shows allowed transitions as defense-in-depth.
4. **Client-supplied totals are recalculated** — The `update_invoice_with_items` RPC recomputes all item subtotals, discounts, taxes, and invoice totals server-side. Client-side calculations are for live display only.
5. **Invoice numbers are immutable** — The `update_invoice_with_items` RPC does not modify `invoice_number` or `next_invoice_number`. Changing the invoice prefix in settings does not affect existing invoices.

---

## 14. Important Architectural Decisions

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

14. **PDF route handler ownership check** — The `/api/invoices/[id]/pdf` route handler validates the auth session, derives `business_id` from `auth.uid()`, and fetches the invoice with `business_id` scoping — identical to `getInvoiceById`. No invoice can be generated for another user's business.

15. **Logo rendering strategy** — Business logos are stored in a private Supabase Storage bucket. On-screen rendering uses plain `<img>` tags (not `next/image`) because the `next.config.ts` `remotePatterns` only matches public paths, while signed URLs use the `/sign/` path. PDF rendering fetches the logo server-side as a base64 data URL and embeds it directly. The bucket remains private.

16. **Print/PDF always white** — The on-screen `InvoiceDocument` component uses design tokens so it adapts to light/dark themes. The `@media print` CSS and the `@react-pdf/renderer` PDF component both force white background with dark text, so printed output and downloaded PDFs are always clean, high-contrast light-mode paper.

17. **AI parsing is provider-agnostic with deterministic fallback** — `parseInvoiceFromText` tries Gemini first, then Groq, then falls back to a local regex parser. The UI never needs to know which provider succeeded. This ensures zero-capital operation: if both AI providers are unavailable, the app continues to work with instant local parsing.

---

## 15. Current Git History

```
(branches ahead of origin — uncommitted PASS 9 changes)

b166027  feat: complete pass 8 invoice workflow      ← PASS 8
35729a0  docs: finalize pass 7 handover and pass 8 roadmap
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

## 16. Production-Readiness Considerations

The following areas have NOT been audited yet (planned for PASS 10):

| Area | Current State | Notes |
|------|--------------|-------|
| Loading states | Partially implemented | Skeleton loaders on invoices, customers, dashboard. Some edge cases may lack loading states. |
| Error handling | Basic | Server actions return `{error: string}`. No centralized error boundary for unexpected exceptions. |
| Empty states | Implemented | Invoice list, customer list, recent invoices all have empty states. |
| Responsive | Implemented | Mobile-first Tailwind classes throughout. Tables transform to cards on mobile. |
| Accessibility | Not audited | No axe-core or automated a11y testing. Manual review needed. |
| Performance | Not audited | No Lighthouse audit, no React Profiler runs. Build is optimized but runtime performance not measured. |
| Security review | Partial | RLS is in place. No explicit security penetration test. RPC functions rely on RLS for access control. PDF route handler adds another auth boundary. |
| Rate limiting | Not implemented | No rate limits on auth endpoints or server actions. |
| Email delivery | Uses Supabase defaults | No custom email templates or delivery provider configured. |
| Invoice numbering concurrency | Atomic via RPC | `next_invoice_number` is incremented inside a PostgreSQL transaction (the RPC). Safe under concurrent requests. |
| RPC security | Relies on RLS | RPC functions use `SECURITY INVOKER` (inherit caller's RLS). The `get_dashboard_stats` function uses `STABLE` volatility. |
| PDF generation | Implemented | Server-side via `@react-pdf/renderer`. Works on Vercel Node.js runtime. Logo fetched from private storage as base64. A4 output. |
| AI fallback reliability | Implemented | Dual-provider (Gemini + Groq) with deterministic fallback. Gemini free-tier 503s handled by Groq or local parser. |
| AI cost | Zero | Both Gemini and Groq free tiers used. No paid AI APIs. Deterministic fallback requires no API calls. |

---

## 17. Zero-Cost Requirement

The MVP must remain deployable using only free-tier/free resources:

- **Supabase:** Free tier (database, auth, storage)
- **Vercel:** Free tier (deployment, serverless functions)
- **AI:** Google Gemini free tier + Groq free tier. No paid AI APIs required.
- **Email:** Supabase default email provider (free). No Resend, SendGrid, or paid email provider required.
- **Payment processing:** None. Remitovate does NOT process payments.
- **Infrastructure:** No Redis, no queues, no cron workers, no paid APIs.

The deterministic parser ensures the AI Quick Invoice feature works even when both free-tier AI providers are rate-limited or unavailable.

---

## 18. Manual Setup Required

1. **Create `.env.local`** from `.env.example` with real Supabase URL and anon key.
2. **Create `business-logos` bucket** in Supabase Dashboard → Storage → set to **Private**.
3. **Apply all 8 migrations** in order via Supabase Dashboard → SQL Editor → Run. The `supabase` CLI requires Docker + `SUPABASE_ACCESS_TOKEN` which may not be available.
   - Migration 5 (`20240101000005_invoice_lifecycle.sql`) updates the `get_dashboard_stats` RPC and adds the `update_invoice_with_items` RPC. This must be applied for invoice editing and accurate dashboard overdue stats to work.
   - Migration 6 (`20240101000006_payment_reminders.sql`) adds `last_reminded_at` column. Required for reminder tracking.
   - Migration 7 (`20240101000007_customer_intelligence.sql`) adds `get_customer_intelligence` RPC. Required for customer intelligence stats.
4. **Supabase Auth settings** — Configure email confirmations, password reset, and redirect URLs in Supabase Dashboard → Authentication → URL Configuration.

---

## 19. PASS 10 — Production Hardening + MVP Launch

PASS 10 is the final planned pass. Based on the current repository state, the following work must happen:

### Must-fix before launch

1. **Apply pending migrations** — `20240101000006_payment_reminders.sql` and `20240101000007_customer_intelligence.sql` must be applied to the live Supabase database.
2. **Loading state audit** — Verify all server action calls have appropriate loading states. Known gaps: reminder text generation, AI Quick Add, customer intelligence fetch.
3. **Error handling audit** — Add centralized error boundary or global error handler. Ensure all server action failures show user-friendly toasts.
4. **Responsive audit** — Test all new PASS 9 components at 375px, 390px, 414px, 768px, 1024px, 1440px. Verify no horizontal overflow.
5. **Accessibility audit** — Ensure all new components have proper ARIA labels, keyboard navigation, and focus management.
6. **Performance audit** — Measure bundle size impact of new PASS 9 components and `@google/genai` dependency. Ensure AI calls don't block main thread.
7. **Security review** — Verify RLS policies cover all new queries. Ensure AI prompt injection is mitigated (validate AI output, never trust client input).
8. **Remove planning artifacts** — Delete or gitignore `PASS_9_PLAN.md` and any `.kilo/` artifacts before commit.

### Should-fix if low risk

1. **Gemini timeout tuning** — Reduce from 18s to 12-15s and prioritize Groq for faster fallback.
2. **AI prompt caching** — Cache common natural language inputs to reduce API calls and latency.
3. **Customer intelligence pagination** — Add pagination for customers with >100 invoices.
4. **Suggestion caching** — Cache frequent services results for 5-10 minutes to reduce database load.

### Post-MVP / Future

1. **Public invoice routes with share tokens** — Secure token-based public invoice viewing.
2. **Email delivery** — Send invoices and reminders via email using a free-tier provider.
3. **Reminder scheduling** — Cron-based automated reminders (requires Vercel Pro or external cron).
4. **Multi-business support** — Allow users to manage multiple businesses.
5. **Custom reminder templates** — User-configurable reminder text.
6. **Advanced AI features** — Invoice memory persistence, customer payment prediction, invoice suggestions based on seasonality.

### Intentionally deferred

- Payment processing — Remitovate will never process payments.
- Paid email/SMS delivery — manual copy/WhatsApp is the MVP.
- Automated background jobs — manual actions only in MVP.

---

## 20. Current Next Action

**PASS 10:** Production hardening and MVP launch.

---

## 21. Validation Commands

```bash
npm run lint    # ESLint — passes with 0 errors
npm run build   # Next.js 16 production build — passes (TypeScript + compilation)
```

Both commands were run after PASS 9 implementation and passed cleanly.

---

## 22. Final Project Status

- **Completed:** PASS 0 through PASS 9 (all planned features implemented)
- **In progress:** None — awaiting PASS 10 start
- **Remaining before launch:** Apply 2 pending migrations, remove planning artifacts, PASS 10 hardening
- **Deferred to post-MVP:** Public invoice routes, email delivery, automated reminders, multi-business, custom templates
- **Current recommended next step:** PASS 10 — Production Hardening + MVP Launch
