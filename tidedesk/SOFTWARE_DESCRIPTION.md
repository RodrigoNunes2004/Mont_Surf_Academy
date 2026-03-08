# TideDesk — Full Software Description & Architecture Statement

**Document Version:** 1.0  
**Date:** March 8, 2025  
**Purpose:** Comprehensive description of implementation, architecture, functionalities, integrations, and user interaction.

---

## 1. Executive Summary

**TideDesk** is a multi-tenant SaaS platform designed for surf schools and equipment rental businesses. It provides end-to-end management of customers, rentals, lesson bookings, equipment inventory, instructors, and revenue analytics. The software is built as a modern web application using Next.js 16, React 19, and integrates with Stripe for subscription billing and card payments, Neon for PostgreSQL hosting, and Vercel for deployment.

---

## 2. What the Software Does

TideDesk centralizes operations for surf schools and rental businesses:

| Domain | Capabilities |
|--------|--------------|
| **Customer Management (CRM)** | Create, edit, search, archive customers; store contact info, notes; paginated lists with filters (active/archived) and sorting (newest, oldest, A–Z, Z–A) |
| **Rental Management** | Create rentals (legacy per-item equipment or category-based variants like Softboard, Wetsuit, Hardboard); track status (Active, Returned, Overdue, Cancelled, Pending); process returns and cancellations; optional Stripe card payment for rentals |
| **Lesson Booking Management** | Schedule lesson bookings with time windows; assign customers, lessons, instructors, optional equipment allocations; lifecycle (Booked → Checked in → Completed) with no-show handling; optional Stripe payment for bookings |
| **Equipment Inventory** | Manage categories and variants (e.g., sizes); track quantities and low-stock thresholds; view availability from active rentals; support for legacy per-item equipment |
| **Instructor Management** | Add instructors with certification and hourly rate; assign to lessons and bookings; toggle active status |
| **Revenue Tracking** | Today/week/month summaries; rental vs lesson breakdown; daily revenue chart (14 or 30 days); activity counts and averages |
| **Subscription Billing** | 30-day free trial; 69 NZD/month Starter plan via Stripe |
| **Multi-Tenant Architecture** | Data scoped by business; users belong to a business and operate within that scope |

---

## 3. Software Architecture

### 3.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19 |
| **Styling** | Tailwind CSS 4, shadcn/ui, Radix UI |
| **Database** | PostgreSQL (Neon) via Prisma 7 |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js (Credentials provider, JWT sessions) |
| **Payments** | Stripe (subscriptions, Checkout, Connect, webhooks) |
| **Storage** | Vercel Blob (avatars) |
| **Deployment** | Vercel |

### 3.2 Architectural Patterns

- **Server Components First:** Pages load data in server components; minimal client-side fetching.
- **API Routes:** REST-style API routes under `/api/` for mutations and external integrations.
- **Tenant Isolation:** All database queries include `businessId`; session carries `businessId` for scoping.
- **JWT Sessions:** Stateless auth; no server-side session store; `role` and `businessId` in token.
- **Layout Hierarchy:** Root layout → Dashboard layout (requires session) → Page-specific layouts.

### 3.3 Project Structure

```
tidedesk/
├── app/
│   ├── (dashboard)/           # Protected routes (require session)
│   │   ├── dashboard/         # Main dashboard
│   │   ├── customers/         # CRM
│   │   ├── rentals/           # Rental management
│   │   ├── bookings/          # Lesson bookings
│   │   ├── equipment/         # Inventory
│   │   ├── instructors/       # Instructor management
│   │   ├── revenue/           # Revenue analytics
│   │   └── settings/         # Business & account settings
│   ├── api/                   # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── webhooks/stripe/
│   │   ├── stripe/checkout|portal/
│   │   ├── onboarding/
│   │   ├── customers|rentals|bookings|equipment|instructors|payments|business|users/
│   │   └── _lib/tenant.ts     # Tenant resolution
│   ├── onboarding/            # Post-checkout setup
│   ├── login|register/       # Auth pages
│   ├── pricing|features/     # Marketing pages
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # shadcn primitives
│   ├── dashboard/            # Sidebar, topbar
│   ├── customers|rentals|bookings|equipment|instructors|settings|landing/
│   └── ...
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts             # DB client
│   ├── server/session.ts     # requireSession helper
│   ├── equipment-availability.ts
│   └── encrypt.ts
└── prisma/
    ├── schema.prisma         # Data models
    └── seed.ts               # Seed data
```

### 3.4 Data Model (Core Entities)

- **Business** — Tenant; Stripe Connect, subscription, timezone, currency, payment defaults
- **User** — Roles: Owner, Staff, Instructor; linked to one business
- **Customer** — CRM records; can be archived
- **Instructor** — Certification, hourly rate, active flag
- **Equipment** — Legacy per-item equipment
- **EquipmentCategory** / **EquipmentVariant** — Category-based inventory (e.g., Softboard, Wetsuit)
- **Lesson** — Lesson types with price, duration, capacity
- **Booking** — Lesson bookings; status: Booked, Checked in, Completed, Cancelled, No-show
- **Rental** — Equipment rentals; status: Pending, Active, Returned, Overdue, Cancelled
- **Payment** — Payments for rentals/bookings; methods: Cash, EFTPOS, Card, Transfer, Online
- **Subscription** — Stripe subscription per business
- **Integration** — FareHarbor, Stripe, etc. (encrypted config)

---

## 4. How the Software Was Implemented

### 4.1 Authentication

- **Credentials Provider:** Email + password; password hashing with scrypt.
- **JWT Strategy:** Session stored in JWT; `role` and `businessId` in token.
- **Session Callback:** Enriches session with avatar (Vercel Blob or Gravatar fallback).
- **Protection:** `requireSession()` in dashboard layout; redirects to `/login` if unauthenticated.

### 4.2 Multi-Tenancy

- Every API route and page uses `session.user.businessId` for tenant scoping.
- `resolveBusinessId()` in `api/_lib/tenant.ts` supports session, header (`x-business-id`), or env fallback for development.
- All Prisma queries include `where: { businessId }`.

### 4.3 Stripe Integration

- **Checkout:** POST `/api/stripe/checkout` creates a subscription checkout session (30-day trial, 69 NZD/month).
- **Onboarding:** After checkout, user lands at `/onboarding?session_id=...` to complete business setup and create account.
- **Webhooks:** POST `/api/webhooks/stripe` handles `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `checkout.session.completed`.
- **Connect:** Businesses can connect Stripe Connect to accept card payments for rentals/bookings.
- **Portal:** Stripe Customer Portal for subscription management.

### 4.4 Equipment Availability

- `lib/equipment-availability.ts` computes in-use quantities per variant from active/overdue rentals and bookings.
- Used on Equipment page to show available vs in-use counts.

### 4.5 UI Components

- shadcn/ui (Button, Card, Table, Dialog, Badge, etc.) with Tailwind.
- Responsive layout: sidebar hidden on mobile; Sheet for mobile nav.
- Forms use server actions or fetch to API routes.

---

## 5. External Software Integrations

| Integration | Purpose | How It Works |
|-------------|---------|--------------|
| **Stripe** | Subscription billing, card payments, Connect | Checkout sessions, webhooks, Connect OAuth; Payment Intents for rentals/bookings |
| **Neon** | PostgreSQL hosting | Serverless Postgres; Prisma with `@prisma/adapter-neon` |
| **Vercel** | Hosting, serverless functions | Deploy Next.js app; env vars for secrets |
| **Vercel Blob** | Avatar storage | Optional; persistent storage for profile photos |
| **FareHarbor** | Booking integration (planned) | Integration model exists; config stored encrypted |
| **Gravatar** | Fallback avatars | Used when no custom avatar; MD5 hash of email |

---

## 6. How Users Can Use and Interact With the Software

### 6.1 Access Flow

1. **Landing Page** (`/`) — Marketing site with Hero, Features, Pricing; "Start 30-Day Free Trial" redirects to Stripe Checkout.
2. **Sign Up** — "Start 30-Day Free Trial" → Stripe Checkout → Onboarding.
3. **Onboarding** (`/onboarding`) — After checkout, user enters business name, owner name, email, password, timezone, currency; account and business created.
4. **Login** (`/login`) — Returning users sign in with email/password.
5. **Dashboard** — All app routes require authentication; unauthenticated users redirect to `/login`.

### 6.2 Navigation (Authenticated Users)

| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview: customers count, active rentals, today's bookings, today's revenue, equipment out |
| `/customers` | CRM: list, search, filter (active/archived), sort; create, edit, archive |
| `/rentals` | Rentals: list by status; create, return, cancel; pay via Stripe (if Connect enabled) |
| `/bookings` | Bookings: list by status; create, check-in, complete, no-show, cancel; pay via Stripe |
| `/equipment` | Categories and variants; create category/variant; view availability |
| `/instructors` | Add/edit instructors; set certification, hourly rate; toggle active |
| `/revenue` | Today/week/month revenue; rental vs lesson breakdown; 14/30-day chart |
| `/settings` | Account (avatar), Business profile, Billing, Instructors, Integrations, Payment (Stripe Connect, default payment method) |

### 6.3 Key User Interactions

- **Customers:** Create via dialog; edit inline; archive/unarchive; search by name, email, phone; paginate.
- **Rentals:** Create with customer + equipment (legacy or category/variant); filter by status; return, cancel; pay (Stripe) when status is Pending.
- **Bookings:** Create with customer, lesson, instructor, time window; optional equipment allocations; check-in, complete, no-show, cancel; pay (Stripe) when unpaid.
- **Equipment:** Create category (e.g., Softboard); create variants (e.g., sizes); set quantities and low-stock thresholds; view available vs in-use.
- **Instructors:** Add instructor; set certification, hourly rate; toggle active (only active appear in booking form).
- **Revenue:** View summaries; toggle 14/30-day chart; see rental vs lesson breakdown.
- **Settings:** Upload avatar; edit business profile; manage Stripe Connect; set default payment method; manage instructors; configure integrations.

### 6.4 Roles

- **Owner** — Full access; typically created during onboarding.
- **Staff** — Same access as Owner for day-to-day operations.
- **Instructor** — Can be assigned to lessons; role stored but UI does not restrict by role currently.

---

## 7. Testing Summary

The application was run locally (`npm run dev`) and tested in-browser:

- **Landing page** — Loads correctly; Hero, Features, Pricing visible; "Start 30-Day Free Trial" and "Sign in" links work.
- **Login** — Sign in with seed credentials (`owner@tidedesk.local` / `ChangeMe123!`) succeeds; redirects to dashboard.
- **Dashboard** — Displays cards for Customers, Active rentals, Today's bookings, Today's revenue, Equipment out.
- **Navigation** — Sidebar links (Dashboard, Customers, Rentals, Bookings, Equipment, Instructors, Revenue, Settings) present and functional.

---

## 8. Deployment

- **Platform:** Vercel
- **Database:** Neon PostgreSQL
- **Migrations:** `npx prisma migrate deploy`
- **Seed:** `npm run db:seed` (optional)
- **Environment:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, Stripe keys, `STRIPE_WEBHOOK_SECRET`

See `DEPLOYMENT.md` for Stripe setup and Auth/Vercel configuration.

---

## 9. Conclusion

TideDesk is a production-ready, multi-tenant SaaS application for surf schools and equipment rental businesses. It combines modern React/Next.js architecture with Prisma, Stripe, and Neon to deliver CRM, rentals, bookings, equipment management, instructor management, and revenue analytics in a single, cohesive platform. Users interact through a responsive web UI with clear navigation, forms, and tables, supported by Stripe for subscriptions and optional card payments via Connect.
