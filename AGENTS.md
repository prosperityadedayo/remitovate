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

# DEVELOPMENT PASSES

The project will be built in controlled passes.

Do not implement future passes unless explicitly instructed.

## PASS 0

Foundation

- verify Next.js
- verify Tailwind
- verify Supabase configuration
- create project instructions
- establish design tokens
- establish reusable UI foundation
- establish Supabase client architecture
- verify development environment

## PASS 1

Marketing website

- navbar
- hero
- invoice preview
- features
- how it works
- AI Quick Invoice section
- mobile section
- CTA
- footer

## PASS 2

Authentication

- signup
- login
- forgot password
- auth states
- Supabase Auth integration

## PASS 3

Application shell

- sidebar
- mobile navigation
- header
- account menu
- dashboard layout
- protected application area

## PASS 4

Dashboard

- statistics
- recent invoices
- statuses
- quick actions
- empty states

## PASS 5

Invoice management

- invoice list
- search
- filters
- responsive invoice cards
- invoice actions

## PASS 6

Invoice builder

- customer selection
- invoice details
- line items
- calculations
- tax
- discount
- notes
- payment information
- preview

## PASS 7

Customers and settings

- customers
- customer details
- business profile
- branding
- logo upload
- invoice numbering
- templates
- settings

## PASS 8

PDF

- professional invoice document
- PDF generation
- download
- print-friendly layout

## PASS 9

Database integration

- real Supabase data
- RLS
- customer persistence
- invoice persistence
- invoice items
- business settings

## PASS 10

Product polish

- loading states
- errors
- empty states
- responsive audit
- accessibility audit
- performance
- security review

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