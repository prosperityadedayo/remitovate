# PASS 8 Plan — PDF Generation, Print, and Invoice Sharing

## Inconsistency to Flag

**`REMITOVATE_HANDOVER.md` Section 14** describes PASS 8 as including payment integration (Stripe/Paystack), payment success/failure handling, and public customer-facing invoice links. **This contradicts the user's explicit instructions in the PASS 8 planning request**, which state:

- Remitovate does NOT process payments
- There is NO payment gateway
- There is NO Stripe/Paystack integration
- There is NO checkout flow
- There is NO customer payment portal
- Money movement happens externally; the business owner manually marks invoices as paid

This plan follows the user's explicit instructions. Payment processing and public invoice routes are deliberately deferred.

---

## 1. Current State (Discovered)

### What PASS 6 provided
- Invoice creation (`/invoices/new`) with `createInvoice` server action and atomic `create_invoice_with_items` RPC
- Invoice detail/preview page (`/invoices/[id]`) with `InvoicePreview` client component
- `getInvoiceById` server action returning `InvoiceWithItems` (with joined `businesses`, `customers`, `invoice_items`)
- `formatCurrency`, `formatDate`, `formatDateShort` utilities
- Custom `Select` component (Radix-based, fixes dark-mode native `<select>` issues)

### What PASS 7 provided
- Invoice list with search, status filter, sort (`/invoices`)
- Status transitions (`updateInvoiceStatus` with `TRANSITION_MAP`)
- Overdue as computed effective status (`getEffectiveStatus`)
- Invoice editing (`/invoices/[id]/edit`) with atomic `update_invoice_with_items` RPC
- Invoice deletion with two-step confirmation
- `InvoiceStatusBadge`, `InvoiceStatusActions`, `InvoiceDeleteButton` components
- Business settings page (`/settings`) with `BusinessForm`
- `getSignedLogoUrl` server action (1-year signed URL, private bucket)

### Pre-existing bugs/issues relevant to PASS 8

**`next.config.ts` images.remotePatterns mismatch:**
```ts
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**.supabase.co",
      pathname: "/storage/v1/object/public/**",  // ← only matches PUBLIC paths
    },
  ],
},
```

The `business-logos` bucket is **private**. Signed URLs use the path `/storage/v1/object/sign/business-logos/...`, which does NOT match `/public/**`. This means `next/image` cannot render signed logo URLs. The existing settings page and account menu use `next/image` with signed URLs — this is a pre-existing rendering bug.

**For PASS 8:** Use plain `<img>` tags for logo rendering in invoice documents (both HTML print view and PDF). Plain `<img>` does not require Next.js image optimization and works with signed URLs.

### Database state
- 6 migrations exist in `supabase/migrations/`
- `20240101000005_invoice_lifecycle.sql` provides `update_invoice_with_items` RPC and updated `get_dashboard_stats`
- No public invoice sharing table exists
- No invoice PDF metadata table exists

### Dependencies currently installed
- No PDF library
- No print-specific CSS
- No sharing-related libraries

---

## 2. Exact PASS 8 Objective

Enable a business owner to take a completed invoice and make it genuinely usable outside the application by:
1. Viewing a professional, print-ready invoice presentation
2. Downloading a professional PDF
3. Printing the invoice cleanly (with or without generating a PDF first)
4. Sharing invoice information through safe, simple mechanisms

**NOT in scope for PASS 8:**
- Payment processing, gateways, or integrations
- Public/customer-facing invoice routes with tokens
- Email delivery infrastructure
- AI features

---

## 3. Features to Implement

### 3.1 Professional Invoice Document (HTML)

Create a standalone, clean invoice document component that renders:
- Business logo (if set) via signed URL
- Business name, email, phone, address, country
- Invoice number, invoice date, due date
- Effective status badge
- Customer name, email, phone, address, country
- Line items table (description, quantity, unit price, discount, tax rate, line total)
- Subtotal, discount, tax, total — with currency formatting
- Notes section (if present)
- Payment information section (if present)
- Business brand colour as a subtle accent

This component is used in:
- The invoice detail page as the document body (extracted from current `InvoicePreview`)
- A dedicated print view

### 3.2 PDF Generation

Add server-side PDF generation using `@react-pdf/renderer` (v4.6.1+, confirmed React 19 compatible since v4.1.0).

Create a route handler `app/api/invoices/[id]/pdf/route.ts` that:
- Validates auth session
- Fetches invoice with `getInvoiceById`-scoped query
- Fetches logo signed URL if `logo_url` exists
- Renders PDF using `@react-pdf/renderer` components
- Returns PDF as `application/pdf` with `Content-Disposition: attachment; filename="{INVOICE_NUMBER}.pdf"`

Create a `InvoicePdfDocument` component using `@react-pdf/renderer` primitives that mirrors the HTML invoice document layout.

### 3.3 Download PDF Action

Add a "Download PDF" button to the invoice detail page that:
- Calls the `/api/invoices/[id]/pdf` endpoint via `fetch`
- Creates a Blob and triggers download via anchor element
- Shows loading state ("Generating PDF...")
- Handles errors with toast feedback
- Uses filename: `{invoice_number}.pdf` (e.g., `INV-0001.pdf`)

### 3.4 Print Invoice

Add a "Print Invoice" button to the invoice detail page that:
- Opens the invoice in a print-friendly view (same document component, no dashboard chrome)
- Calls `window.print()`
- Uses `@media print` CSS for clean paper output

The existing `InvoicePreview` page gets a dedicated print mode. Optionally, add a `/invoices/[id]/print` route for a standalone print page.

### 3.5 Sharing (MVP)

No public routes. No database changes.

Implement three safe sharing mechanisms on the invoice detail page:

1. **Web Share API** — calls `navigator.share()` with a formatted invoice summary text. Works on mobile (iOS Safari, Android Chrome). Gracefully degrades if unsupported.

2. **Copy to Clipboard** — copies a pre-formatted text summary including:
   - Invoice number
   - Total amount (formatted in business currency)
   - Due date
   - Business name
   - A note about payment instructions

3. **Copy Invoice Link** — copies the internal invoice URL (`/invoices/{id}`). This is only useful if the recipient also has a Remitovate account, but it's safe and simple. Note to user that the recipient must be logged in to view.

All sharing actions use toast feedback ("Summary copied", "Link copied", "Shared successfully").

---

## 4. Files to Create

| File | Purpose |
|------|---------|
| `components/invoices/invoice-document.tsx` | Standalone invoice document component (HTML). No dashboard chrome, no "use client" unless needed. Receives `InvoiceWithItems` + `logoUrl` props. |
| `components/invoices/invoice-pdf-document.tsx` | `@react-pdf/renderer` document component. Mirrors `InvoiceDocument` layout using PDF primitives (`Document`, `Page`, `View`, `Text`, `Image`, `StyleSheet`). |
| `app/api/invoices/[id]/pdf/route.ts` | Route handler that generates PDF, validates auth, fetches invoice data, returns PDF response. |
| `app/invoices/[id]/print/page.tsx` | Optional: standalone print route for the invoice document. |

---

## 5. Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `@react-pdf/renderer` dependency |
| `next.config.ts` | Add `serverComponentsExternalPackages: ['@react-pdf/renderer']` (required for Next.js App Router RSC compatibility — confirmed in `@react-pdf/renderer` docs) |
| `components/invoices/invoice-preview.tsx` | Extract document body into `InvoiceDocument` component. Add "Download PDF", "Print Invoice", and "Share" action buttons. Keep existing edit/status/delete actions. |
| `app/globals.css` | Add `@media print` styles for clean invoice printing. |

---

## 6. Database Changes

**None.**

No new tables, no new columns, no new RLS policies needed for PASS 8.

---

## 7. Dependencies

| Package | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| `@react-pdf/renderer` | ^4.6.1 | Server-side PDF generation | Industry-standard React PDF library. Confirmed React 19 compatible (since v4.1.0). No Puppeteer/Chromium needed. Server-side only — does not affect client bundle. ~457KB installed. |

No other new dependencies.

---

## 8. PDF Strategy

### Library: `@react-pdf/renderer`

**Why this library:**
- React component API — consistent with the codebase
- Server-side rendering to buffer/stream — works on Vercel (Node.js runtime)
- No headless browser, no Puppeteer, no Chromium
- Flexbox layout — easier than manual x/y positioning
- React 19 compatible since v4.1.0 (confirmed via official docs)
- Last published 2025-12-29, actively maintained

**Next.js compatibility:**
- The `@react-pdf/renderer` docs confirm: "before Next.js 14.1.1, Next.js (App Router) suffered from a bug that caused the Next.js server to crash when using react-pdf." Our project uses Next.js latest (15+), so this is resolved.
- However, `@react-pdf/renderer` must be listed in `serverComponentsExternalPackages` in `next.config.ts` to prevent the RSC bundler from stripping required React internals.

**Rendering approach:**
- Use `renderToBuffer()` in the route handler — simplest for single-page invoice PDFs
- For invoices with many items (>20), use `renderToStream()` to handle pagination — but `renderToBuffer` is sufficient for MVP; pagination is automatic in `@react-pdf/renderer`

**Logo handling:**
- Server action `getSignedLogoUrl(path)` fetches a signed URL (1-year expiry)
- In the PDF component, use `@react-pdf/renderer`'s `<Image>` component with the signed URL
- `@react-pdf/renderer`'s `<Image>` fetches the image server-side during rendering — signed URLs are valid
- If logo fetch fails (signed URL expired, network error), render a placeholder text ("Logo") instead of crashing

**Font strategy:**
- Use default Helvetica font (built into PDF spec) — no custom font registration needed for MVP
- Professional enough for invoicing; custom fonts can be added in a future pass

**Filename:**
- `{invoice_number}.pdf` — e.g., `INV-0001.pdf`
- The `invoice_number` is server-generated as `{prefix}-{4-digit-padded}` — safe for filenames, no UUID exposure

**Error handling:**
- If PDF generation fails: return 500 with error toast on client
- If invoice not found or unauthorized: return 404/403
- If logo fails to load in PDF: render placeholder, log warning, do not fail the entire PDF

---

## 9. Sharing Strategy

### No public routes. No database changes.

### Web Share API
- Detects `navigator.share` support
- Shares a formatted text string with invoice summary
- Falls back silently if unsupported (desktop browsers without Web Share)

### Copy to Clipboard
- Uses `navigator.clipboard.writeText()`
- Copies formatted invoice summary text
- Gracefully handles `clipboard` API unavailability with toast error

### Copy Invoice Link
- Copies the current page URL (or `/invoices/{id}`)
- Note: requires the recipient to be logged in to Remitovate — useful for accountants/bookkeepers who also use the app

### Shared text format:
```
Invoice #{invoice_number} from {business_name}
Total: {formatted_total}
Due: {formatted_due_date}

Payment instructions: {payment_information_summary}

View invoice: {url}
```

### Why no public route in PASS 8:
- A public invoice route requires a new `invoice_shares` table, secure token generation, token-based RLS bypass, proxy middleware exception, and a public layout
- The security surface area is significant: token enumeration, data exposure, expiry/revocation, auth bypass edge cases
- The MVP sharing mechanisms (Web Share + copy-to-clipboard) cover the immediate need without architectural risk
- Public sharing is deferred to PASS 9/10 where it can be designed and reviewed properly

---

## 10. Security Strategy

### Invoice access
- All invoice retrieval goes through existing server actions (`getInvoiceById`) or the new route handler
- `getInvoiceById` already scopes queries by `business_id` derived from `auth.uid()`
- The PDF route handler must replicate this scoping — do NOT trust the URL `id` alone

### PDF route handler security
```ts
// Pattern: validate auth → derive business_id → fetch invoice with business_id filter
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return new Response("Unauthorized", { status: 401 });

const { data: business } = await supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle();
if (!business) return new Response("No business", { status: 403 });

const { data: invoice } = await supabase.from("invoices").select("*, customers(*), businesses(*), invoice_items(*)").eq("id", params.id).eq("business_id", business.id).maybeSingle();
if (!invoice) return new Response("Not found", { status: 404 });
```

### Logo security
- Logos remain in the **private** `business-logos` bucket
- Signed URLs are fetched server-side via `getSignedLogoUrl`
- The PDF component receives the signed URL string — no client-side exposure beyond what's already in the invoice detail page
- Signed URLs have 1-year expiry — sufficient for PDF generation at download time

### No data leakage
- The PDF contains only: business name, email, phone, address, country; customer name, email, phone, address, country; invoice details; line items; totals; notes; payment information
- The PDF does NOT contain: internal UUIDs, user_id, business_id, database timestamps, auth tokens
- Payment information is intentionally included — it's the payment instructions the business owner entered for the customer

### Client-side
- Buttons use existing patterns (toast feedback, loading states)
- No client-side invoice data caching beyond React state
- Download uses `fetch` with credentials (cookies auto-sent by browser for same-origin)

---

## 11. Logo Strategy

### Current state
- Logos stored in **private** `business-logos` bucket at path `{user_id}/{timestamp}.{ext}`
- `getSignedLogoUrl(path)` returns a 1-year signed URL
- `next/image` cannot render signed URLs due to `remotePatterns` mismatch (`/public/**` vs `/sign/**`)

### PASS 8 approach
- Use plain `<img>` tags (not `next/image`) for all logo rendering in invoice documents
- Server-side: `getSignedLogoUrl` fetches signed URL, passes string to PDF/HTML components
- If `logo_url` is null/empty: render a placeholder text/icon instead
- If signed URL fetch fails: render placeholder, do not crash PDF generation
- Do NOT make the bucket public
- Do NOT add new image domains to `next.config.ts` (the mismatch remains a pre-existing issue to fix separately)

---

## 12. Responsive UX Plan

### Invoice detail page
- Existing responsive grid (`md:grid-cols-2`) for business/customer info and dates
- Line items table uses `overflow-x-auto` — works on all breakpoints
- New action buttons (Download PDF, Print, Share) use responsive flex layout:
  - Mobile: stacked vertically or wrapped
  - Desktop: horizontal row with the existing Edit/Status/Delete buttons

### Invoice document (HTML/Print)
- Designed for A4 paper dimensions (210mm × 297mm)
- Print CSS (`@media print`) sets:
  - `@page { size: A4; margin: 15mm; }`
  - `body { background: white; }`
  - Hides all dashboard chrome, buttons, navigation
  - Ensures text is black on white (no dark mode)
  - Avoids page breaks inside table rows (`break-inside: avoid` on `<tr>`)
  - Controls widows/orphans for long text blocks

### PDF document
- A4 page size via `@react-pdf/renderer` `<Page size="A4" style={{ padding: 20 }}>`
- Fixed-width layout consistent with paper proportions
- Automatic pagination for long invoices (handled by `@react-pdf/renderer`)
- Brand colour used for header accent/border only — not overwhelming

### Buttons
- Touch targets ≥ 44px (existing Button component already meets this)
- Download PDF: primary style
- Print: secondary/outline style
- Share: ghost style (dropdown or split button)
- Loading states: button shows "Generating PDF..." / "Printing..." with spinner or disabled state

---

## 13. Error, Loading, and Empty States

| Scenario | Handling |
|----------|----------|
| Invoice not found / deleted | `notFound()` — existing pattern |
| Unauthorized invoice | `getInvoiceById` returns null → `notFound()` |
| PDF generation failure | Toast error: "Failed to generate PDF. Please try again." |
| Logo fetch failure in PDF | Render placeholder text; log warning; do not fail |
| Network failure during download | Toast error: "Download failed. Please try again." |
| Browser doesn't support Web Share | Silently fall back — button either hidden or shows toast "Share not supported on this browser" |
| Clipboard unavailable | Toast error: "Unable to copy. Please try manually." |
| Long invoice (many items) | PDF auto-paginates; print CSS uses `break-inside: avoid` |
| Missing optional business info | Gracefully omit fields (existing pattern in `InvoicePreview`) |
| No logo set | Show "No logo" placeholder in both PDF and print view |
| User clicks "Download PDF" twice | Disable button during generation; re-enable on completion or error |

---

## 14. Manual Testing Plan

### Before implementation
1. Verify PASS 7 migration `20240101000005_invoice_lifecycle.sql` is applied to Supabase (if not, it must be applied first)
2. Create a test business with logo, brand colour, payment terms
3. Create a test customer
4. Create a test invoice with multiple line items, notes, and payment information
5. Verify the invoice detail page renders correctly

### After implementation

**PDF Generation:**
1. Click "Download PDF" — verify PDF downloads with correct filename (`INV-XXXX.pdf`)
2. Open PDF — verify business logo renders (or placeholder if no logo)
3. Verify all invoice data matches: number, dates, customer info, line items, totals, notes, payment info
4. Verify brand colour accent appears
5. Test with no logo — verify placeholder renders
6. Test with long invoice (10+ items) — verify pagination works
7. Test on dark mode — PDF should be unaffected (server-generated)

**Print:**
1. Click "Print Invoice" — verify print preview opens
2. Verify no dashboard chrome (sidebar, header, buttons) appears in print preview
3. Verify A4 page size, margins, and text sizing
4. Print to PDF — verify output matches the downloaded PDF
5. Test on mobile browser print

**Sharing:**
1. Click Share → Copy Summary — verify clipboard contains formatted text
2. Click Share → Copy Link — verify invoice URL is copied
3. On mobile (or browser with Web Share support) — verify Web Share dialog opens with summary
4. Test sharing on desktop browser without Web Share — verify graceful fallback

**Responsive:**
1. Test at 375px, 390px, 414px, 768px, 1024px, 1440px
2. Verify no horizontal overflow on mobile
3. Verify action buttons are usable on touch devices
4. Verify print preview is clean on all viewport sizes

**Security:**
1. Attempt to access `/api/invoices/{other_user_invoice_id}/pdf` — verify 404/403
2. Verify PDF does not contain internal UUIDs or user IDs
3. Verify signed URL is not leaked in PDF metadata

**Error states:**
1. Disable network → click Download PDF → verify error toast
2. Create invoice with empty logo_url → verify PDF renders with placeholder
3. Revoke Supabase session → verify redirect to login

---

## 15. Production-Readiness Checks

| Check | Status |
|-------|--------|
| `npm run lint` passes | Must pass after changes |
| `npm run build` passes | Must pass — `@react-pdf/renderer` needs `serverComponentsExternalPackages` |
| TypeScript strict mode | Must pass |
| React 19 compatibility | Confirmed: `@react-pdf/renderer` v4.1.0+ supports React 19 |
| Vercel deployment | `@react-pdf/renderer` works server-side on Vercel Node.js runtime |
| RLS still enforced | PDF route handler must derive business_id from auth, not trust URL params |
| Signed URL expiry | 1-year signed URLs — sufficient for one-time PDF generation at download |
| Bundle size | `@react-pdf/renderer` is server-only; does not affect client bundle |
| No paid dependencies added | `@react-pdf/renderer` is MIT-licensed, free |
| No paid infrastructure | Uses existing Vercel + Supabase |

---

## 16. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `@react-pdf/renderer` build issues with Next.js RSC | Low | Medium | `serverComponentsExternalPackages` in `next.config.ts` (confirmed in docs) |
| PDF component bundle size increases cold start | Low | Low | `@react-pdf/renderer` is server-only; Vercel Node.js functions handle it |
| Logo signed URL expires during PDF generation | Very low | Low | 1-year expiry; fetch happens at generation time |
| PDF output doesn't perfectly match HTML print view | Medium | Low | Two separate rendering paths; visual parity is a goal but not guaranteed |
| `next/image` logo bug persists | Certain | Low | Deliberately using `<img>` in PASS 8; fix `remotePatterns` separately |
| `renderToBuffer` memory issues for very large invoices | Low | Low | Switch to `renderToStream` if needed; typical invoices are <50 items |
| Handover doc inconsistency causes confusion | Certain | Low | This plan explicitly follows user instructions, not handover suggestions |

---

## 17. Deliberately Deferred

| Feature | Reason |
|---------|--------|
| Payment integration (Stripe/Paystack/etc.) | User explicitly excluded from PASS 8. Remitovate does not process payments. |
| Public/customer-facing invoice routes with share tokens | Requires new table, secure token management, proxy exception, public layout. Too large for PASS 8 scope. Safe to defer to PASS 9/10. |
| Email delivery (send invoice via email) | Requires email provider (Resend, etc.) and email template infrastructure. Deferred. |
| AI Quick Invoice | PASS 9 feature. |
| Invoice memory / frequently used services | PASS 9 feature. |
| Customer intelligence | PASS 9 feature. |
| Payment reminders | PASS 9 feature. |
| `next.config.ts` image remotePatterns fix | Pre-existing bug. Fix in PASS 10 production hardening. |
| Custom fonts in PDF | Default Helvetica is sufficient for MVP. Add in future pass if needed. |

---

## 18. Definition of Done

PASS 8 is complete when ALL of the following are verified:

1. `npm run lint` passes with zero errors
2. `npm run build` passes with zero errors
3. From the invoice detail page (`/invoices/[id]`), the user can:
   - Click "Download PDF" and receive a correctly formatted `{INVOICE_NUMBER}.pdf` file
   - Click "Print Invoice" and see a clean, print-ready invoice with no dashboard chrome
   - Click "Share" → "Copy summary" and have the formatted text in their clipboard
   - Click "Share" → "Copy link" and have the invoice URL in their clipboard
   - On supported browsers, click "Share" and use the Web Share API
4. The PDF contains: business branding (logo + name + contact), customer info, invoice number/dates/status, line items, subtotal/discount/tax/total, notes, payment information
5. The PDF does NOT contain internal UUIDs, user IDs, or auth tokens
6. The PDF respects the business brand colour as a subtle accent
7. The print view has no horizontal overflow at 375px viewport width
8. The PDF and print output handle invoices with 20+ line items (auto-pagination)
9. Error states are handled: PDF generation failure shows toast; missing logo shows placeholder; unauthorized access returns 404
10. No database migrations are added
11. Only one new dependency: `@react-pdf/renderer` (justified for PDF generation)
12. `next.config.ts` includes `serverComponentsExternalPackages: ['@react-pdf/renderer']`

---

## Decision: PDF Library

**Chosen: `@react-pdf/renderer`**

Resolved questions:
- **React 19 compatible?** Yes, since v4.1.0 (confirmed via official docs and npm data showing v4.6.1 as latest, published 2025-12-29)
- **Next.js App Router compatible?** Yes, with `serverComponentsExternalPackages` config (confirmed via docs)
- **Vercel compatible?** Yes, pure Node.js rendering, no Puppeteer/Chromium
- **Logo rendering?** Yes, `<Image>` component fetches from signed URL server-side
- **Client bundle impact?** Zero — used only in server actions/route handlers
- **Alternatives considered:**
  - `pdfkit`: Lower-level, manual x/y positioning, more code for same result
  - `jsPDF` + `jspdf-autotable`: Manual coordinate layout, less maintainable for complex invoices
  - Browser `window.print()` only: No true "Download PDF" — user must manually "Save as PDF"
  - Puppeteer/Playwright: Requires Chromium, not Vercel-compatible without external service
