# REMITOVATE — PROJECT INSTRUCTIONS

## Product

Remitovate is a modern invoicing and payment assistant for freelancers, creators, consultants, contractors, agencies and small businesses.

Core promise:

Create invoices. Send them. Get paid.

Remitovate should feel like a real SaaS product, not a portfolio demo.

---

## Product Philosophy

The product should reduce repetitive work.

A user should set up their business once and then be able to return later and quickly create invoices without repeatedly entering:

- business information
- logo
- brand colours
- invoice numbering
- currency
- payment terms
- customer information

---

## Target Users

Primary users:

- freelancers
- creators
- consultants
- contractors
- small agencies
- small businesses

---

## MVP

The MVP should eventually support:

### Authentication

- Sign up
- Login
- Logout
- Forgot password
- Protected routes

### Business profile

- Business name
- Business email
- Phone
- Address
- Country
- Currency
- Logo
- Brand colour
- Invoice prefix
- Starting invoice number
- Default payment terms
- Invoice template

### Customers

- Create
- Edit
- Delete
- Search
- View customer
- Invoice history

### Invoices

- Create
- Edit
- Save draft
- Invoice number
- Customer
- Invoice date
- Due date
- Line items
- Quantity
- Unit price
- Discount
- Tax
- Notes
- Payment information
- Status

### Dashboard

- Total invoiced
- Paid
- Outstanding
- Overdue
- Recent invoices
- Quick actions

### PDF

- Professional invoice preview
- Generate invoice PDF
- Download PDF

---

## Future Differentiation

Remitovate should eventually include:

### AI Quick Invoice

A user can write:

"I designed Sarah's website for 150000 naira and hosting is 20000."

The system converts this into structured invoice line items.

AI is optional.

The core application must work without AI.

### Invoice Memory

Remember:

- customers
- branding
- invoice numbering
- payment terms
- frequently used services

### Customer intelligence

Show:

- total invoiced
- total paid
- outstanding balance
- invoice history
- last invoice

### Payment follow-ups

Eventually provide polite payment reminder assistance.

---

# TECH STACK

## Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React

## Backend

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage

## Deployment

- Vercel

## Version control

- Git
- GitHub

Do not introduce paid infrastructure.

Do not introduce unnecessary frameworks.

---

# DATABASE ARCHITECTURE

The intended high-level relationship is:

User
↓
Profile
↓
Business
├── Customers
└── Invoices
    └── Invoice Items

Potential core tables:

- profiles
- businesses
- customers
- invoices
- invoice_items

Use UUID primary keys.

Use timestamps.

Use foreign keys.

Use Row Level Security.

A user must never be able to access another user's business, customers or invoices.

Database design must be reviewed before destructive migrations.

---

# STORAGE

Supabase Storage will eventually be used for:

- business logos

Do not store sensitive secrets in public storage.

---

# DESIGN SYSTEM

Remitovate must look:

- premium
- minimal
- professional
- trustworthy
- modern
- calm
- polished

The quality bar should feel comparable to modern products such as Stripe, Linear, Vercel and Notion.

Do not copy their designs.

---

# COLORS

Primary:

#4F46E5

Primary dark:

#4338CA

Primary light:

#EEF2FF

Background:

#FFFFFF

Secondary background:

#F8FAFC

Primary text:

#0F172A

Secondary text:

#475569

Muted text:

#64748B

Border:

#E2E8F0

Success:

#16A34A

Warning:

#D97706

Error:

#DC2626

Info:

#2563EB

Use the primary colour carefully.

Do not make every element purple.

---

# TYPOGRAPHY

Use a clean modern sans-serif.

Prefer Geist when available.

Maintain strong typography hierarchy.

Financial numbers should be highly readable.

Do not make every heading enormous.

---

# ICONS

Never use emojis in the application UI.

Use Lucide React icons.

Icons should have a functional purpose.

---

# RESPONSIVENESS

Mobile responsiveness is mandatory.

Design intentionally for:

375px
390px
414px
768px
1024px
1440px

Never simply shrink the desktop interface.

Mobile layouts must be intentionally designed.

Avoid horizontal overflow.

Touch targets should be comfortable.

Tables should transform into usable mobile layouts when necessary.

---

# ANIMATION

Use subtle animations only.

Good:

- hover transitions
- button transitions
- dropdown transitions
- modal transitions
- page transitions
- skeleton loading
- subtle entrance animations

Avoid:

- excessive animation
- glowing interfaces
- distracting effects
- unnecessary parallax

---

# ARCHITECTURE

Keep the architecture simple.

Prefer:

app/
components/
lib/
types/
public/

Do not create unnecessary:

- repositories
- factories
- adapters
- domain layers
- use-case layers
- service layers

unless the project genuinely requires them.

Reuse components.

Avoid duplicate UI components.

---

# CODE QUALITY

Use TypeScript properly.

Avoid `any`.

Use semantic HTML.

Maintain accessibility.

Keep components reasonably small.

Do not create tiny components unnecessarily.

Do not put the entire application into one component.

Use clear naming.

Do not modify unrelated files.

Do not silently change architecture.

---

# AI AGENT RULES

Before implementing a task:

1. Inspect the relevant existing code.
2. Understand the current architecture.
3. Identify dependencies.
4. Plan the change.
5. Implement the smallest clean solution.
6. Run appropriate validation.
7. Report what changed.

Do not assume files exist.

Do not overwrite working code blindly.

Do not rewrite unrelated components.

Do not install dependencies unless needed.

Explain why a new dependency is required.

Do not use paid services.

---

# GIT SAFETY

Never run destructive Git commands without explicit approval.

Never:

- git reset --hard
- git clean -fd
- git push --force
- delete branches

without asking first.

Before major changes, inspect:

git status

Do not commit unless explicitly requested.

---

## DEVELOPMENT PASSES

The project is built in controlled passes.

Do not implement future passes unless explicitly instructed.

### PASS 0 — Foundation (COMPLETE)

- Verify Next.js, TypeScript, Tailwind, and Supabase client architecture
- Establish design tokens with Remitovate color system in `app/globals.css`
- Add foundation UI primitives (card, input, button, badge, etc.)
- Create `types/index.ts` with base domain types
- Establish Supabase client architecture (`lib/supabase/server.ts`, `client.ts`, `proxy.ts`)
- Verify `npm run lint` and `npm run build` pass

### PASS 1 — Marketing Website (COMPLETE)

- Navbar, hero, invoice preview, features, how it works, AI Quick Invoice, mobile section, CTA, footer
- Full public-facing website at `/`

### PASS 2 — Authentication + Business Onboarding (COMPLETE)

- **Authentication:** Signup, login, logout, forgot password, reset/update password, email confirm, error page
- **Business onboarding:** `/dashboard/onboarding` with all business fields, logo upload, brand colour, invoice preferences
- **Theming:** Light/dark/system theme support with theme switcher
- Supabase Auth integration with cookie-based session management
- Route protection via proxy middleware
- Auth-aware navigation

### PASS 3 — Dashboard Foundation + Initial Database (COMPLETE)

- **Application shell:** Sidebar, mobile navigation, header, account menu, dashboard layout, protected area
- **Database architecture:** `profiles`, `businesses`, `customers`, `invoices`, `invoice_items` tables with full RLS
- **Storage:** Private `business-logos` bucket with per-user path-based RLS
- **Onboarding gate:** Redirect to `/dashboard/onboarding` if no business

### PASS 4 — Dashboard Productionization (COMPLETE)

- **Dashboard stats:** Total Invoiced, Paid, Outstanding, Overdue via `get_dashboard_stats` RPC
- **Recent invoices:** 5 most recent with customer name, status, total, due date
- **Quick actions:** New Invoice, Add Customer
- **Getting started:** 3-step checklist with setup indicator
- **Empty states and skeleton loading** throughout

### PASS 5 — Customers (COMPLETE)

- **Customer list:** Search (debounced, URL-synced), count, responsive layout, empty state, skeleton loading
- **Create customer:** Form with validation, loading state, toast feedback, redirect
- **Customer detail:** Contact info grid, breadcrumbs, edit/delete actions, invoice history empty state
- **Edit customer:** Pre-filled form, redirects to detail on success
- **Delete customer:** Safety check (blocked if invoices exist), two-step confirmation, toast feedback
- Server actions: `getCustomers`, `getCustomerById`, `createCustomer`, `updateCustomer`, `deleteCustomer`
- Migration: `20240101000003_customer_deletion_safety.sql`

### PASS 6 — Invoice Creation (COMPLETE)

- **Invoice list:** `/invoices` with status badges, currency formatting, empty state, "New Invoice" button
- **Invoice builder:** `/invoices/new` with customer selection, invoice details, line items (add/remove), live calculations (subtotal, discount, tax, total), notes, payment info, form validation, toast feedback
- **Invoice detail/preview:** `/invoices/[id]` with business/customer info, line items table, totals, notes, payment info
- **Server actions:** `getCustomersForInvoice`, `getBusinessForInvoice`, `createInvoice`, `getInvoiceById`, `getInvoices`
- **Atomic creation:** `create_invoice_with_items` PostgreSQL RPC with `next_invoice_number` column
- Migration: `20240101000004_invoice_builder.sql`
- Custom `Select` component in `components/ui/select.tsx` (Radix-based, fixes dark-mode dropdown readability)

### PASS 7 — Invoice Lifecycle + Management (COMPLETE)

- **Invoice list enhancements:** `/invoices` now supports debounced search (URL-synced), status filter dropdown, and sort dropdown
- **Invoice status management:** Status transitions enforced via `TRANSITION_MAP` (Draft → Sent, Draft → Cancelled, Sent → Paid, Sent → Cancelled, Paid → Cancelled, Cancelled → Reopen as Draft)
- **Overdue as effective status:** "Overdue" is computed dynamically when `status = 'sent'` and `due_date < today` (via `getEffectiveStatus`). Not stored. Dashboard stats RPC updated accordingly.
- **Invoice editing:** `/invoices/[id]/edit` pre-fills all fields (customer, dates, line items, notes, payment info) from server data; saves atomically via `update_invoice_with_items` RPC
- **Invoice deletion:** `/invoices/[id]` page header has two-step delete confirmation button; deletes invoices scoped to business_id (items cascade-delete)
- **Settings route:** `/settings` with business profile form (name, email, phone, address, country, currency, logo, brand colour, invoice prefix, payment terms, template)
- **Components:** `InvoiceStatusBadge`, `InvoiceStatusActions`, `InvoiceDeleteButton`, `BusinessForm` (settings)
- **Server actions:** `updateInvoice`, `updateInvoiceStatus`, `deleteInvoice`, `updateBusiness`
- **Migration:** `20240101000005_invoice_lifecycle.sql` — updates `get_dashboard_stats` RPC (dynamic overdue), adds `update_invoice_with_items` RPC
- **Guard:** Paid and cancelled invoices are not editable (Edit button hidden, edit page redirects to detail)

### PASS 8 — PDF + Sharing + Payments

- Professional invoice PDF generation
- PDF download
- Print-friendly layout
- (Future) Sharing via email link
- (Future) Payment integration

### PASS 9 — Reminders + Automation + AI

- Payment reminders / follow-up assistance
- Invoice memory (frequently used services)
- Customer intelligence (total invoiced, paid, outstanding per customer)
- AI Quick Invoice (natural language → structured line items)

### PASS 10 — Production Hardening + MVP Launch

- Loading states audit
- Error handling audit
- Empty states audit
- Responsive audit
- Accessibility audit
- Performance audit
- Security review
- MVP validation and launch

---

# IMPORTANT

The full roadmap is context only.

Only execute the pass explicitly requested.

Never jump from Pass 0 to Pass 10.

When a pass is complete:

1. Run validation.
2. Explain what changed.
3. List changed files.
4. List new dependencies.
5. List anything that needs manual configuration.
6. Report remaining issues.

Then stop and wait for the next instruction.