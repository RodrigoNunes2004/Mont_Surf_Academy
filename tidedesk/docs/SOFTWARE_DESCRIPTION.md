# TideDesk — Full Software Description

**Document Version:** 2.0  
**Last Updated:** March 9, 2026  
**Purpose:** Comprehensive description of implementation, architecture, functionalities, integrations, improvements, and user interaction.

---

## 1. Executive Summary

**TideDesk** is a multi-tenant SaaS platform designed for surf schools and equipment rental businesses. It provides end-to-end management of customers, rentals, lesson bookings, equipment inventory, instructors, and revenue analytics. The software is built as a modern web application using Next.js 16, React 19, and integrates with Stripe for subscription billing and card payments, Neon for PostgreSQL, Resend and Twilio for notifications, Stormglass for marine weather, and Upstash Redis for rate limiting and idempotency. It is deployed on Vercel with automated cron jobs for reminders and weather alerts.

---

## 2. What the Software Does

TideDesk centralizes operations for surf schools and rental businesses into a single dashboard.

### 2.1 Core Capabilities

| Domain | Capabilities |
|--------|--------------|
| **Customer Management (CRM)** | Create, edit, search, archive customers; store contact info (name, phone, email, DOB), notes; paginated lists with filters (active/archived) and sorting (newest, oldest, A–Z, Z–A) |
| **Rental Management** | Create rentals (legacy per-item equipment or category-based variants like Softboard, Wetsuit, Hardboard); track status (Pending, Active, Returned, Overdue, Cancelled); process returns and cancellations; optional Stripe card payment for rentals |
| **Lesson Booking Management** | Schedule lesson bookings with time windows; assign customers, lessons, instructors, optional equipment allocations; lifecycle (Booked → Checked in → Completed) with no-show and cancellation handling; optional Stripe payment for bookings |
| **Equipment Inventory** | Manage categories and variants (e.g., sizes); track quantities and low-stock thresholds; view availability from active rentals; support for legacy per-item equipment |
| **Instructor Management** | Add instructors with certification and hourly rate; assign to lessons and bookings; toggle active status; only active instructors appear in booking forms |
| **Revenue Tracking** | Today/week/month summaries; rental vs lesson breakdown; daily revenue chart (14 or 30 days); activity counts and averages |
| **Subscription Billing** | 30-day free trial; 69 NZD/month Starter plan via Stripe Checkout |
| **Multi-Tenant Architecture** | Data scoped by business; users belong to a business and operate within that scope |

### 2.2 Public Online Booking

- **URL:** `/book/[school-slug]` — Customers can book lessons online without creating an account
- **Flow:** Select lesson → Pick date → Choose time slot → Enter customer details → Optional equipment (board, wetsuit) → Pay now (Stripe) or Pay later
- **Embeddable:** Add `?embed=1` for iframe embedding on external websites
- **Timezone:** Uses business timezone; clear note shown on booking form for multi-region clarity
- **Availability:** Controlled by business hours (open/close), instructor capacity, and equipment stock

### 2.3 Business Settings

- **Online Booking Settings:** Enable/disable public booking; custom message when disabled; business hours (open/close)
- **Payment Settings:** Default payment method (Cash, EFTPOS, Card, Transfer, Online); Stripe Connect for online card payments
- **Business Profile:** Name, location, address, phone, contact email, timezone, currency, coordinates (lat/lng for weather)

---

## 3. Software Architecture

### 3.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| **Database** | PostgreSQL (Neon) via Prisma 7, `@prisma/adapter-neon` |
| **Authentication** | NextAuth.js (Credentials provider, JWT sessions) |
| **Payments** | Stripe (subscriptions, Checkout, Connect, webhooks, Payment Intents) |
| **Storage** | Vercel Blob (avatars) |
| **Deployment** | Vercel |

### 3.2 Architectural Patterns

- **Server Components First:** Pages load data in server components; minimal client-side fetching
- **API Routes:** REST-style API under `/api/` for mutations and integrations
- **Tenant Isolation:** All database queries include `businessId`; session carries `businessId` for scoping
- **JWT Sessions:** Stateless auth; no server-side session store; `role` and `businessId` in token
- **Layout Hierarchy:** Root layout → Dashboard layout (requires session) → Page-specific layouts

### 3.3 Project Structure

```
tidedesk/
├── app/
│   ├── (dashboard)/           # Protected routes (require session)
│   │   ├── dashboard/         # Main dashboard
│   │   ├── customers/         # CRM
│   │   ├── rentals/           # Rental management
│   │   ├── bookings/         # Lesson bookings
│   │   ├── equipment/        # Inventory
│   │   ├── instructors/      # Instructor management
│   │   ├── revenue/          # Revenue analytics
│   │   └── settings/        # Business & account settings
│   ├── api/                   # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── webhooks/stripe/
│   │   ├── stripe/checkout|portal/
│   │   ├── cron/notifications|weather/
│   │   ├── public/schools/[slug]/   # Public booking API
│   │   └── customers|rentals|bookings|equipment|instructors|payments|business|users/
│   ├── book/[businessSlug]/   # Public booking page + confirmation
│   ├── onboarding/           # Post-checkout setup
│   ├── login|register|pricing|features/
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # shadcn primitives
│   ├── dashboard/            # Sidebar, topbar
│   ├── customers|rentals|bookings|equipment|instructors|settings|landing|book/
│   └── ...
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts             # DB client
│   ├── server/session.ts     # requireSession helper
│   ├── rate-limit.ts         # Upstash rate limiter (30 req/min per IP)
│   ├── idempotency.ts        # Booking idempotency (Upstash, 24h TTL)
│   ├── currency.ts           # Currency formatting (NZD, USD, EUR, GBP, AUD, BRL)
│   ├── equipment-availability.ts
│   └── encrypt.ts
├── services/
│   ├── bookingService.ts
│   ├── notificationService.ts
│   └── ...
├── modules/
│   ├── notifications/        # notificationService (SMS/email dispatch)
│   └── weather/             # weatherService (Stormglass, cache)
├── integrations/
│   ├── email/resend.ts
│   ├── twilio.ts
│   └── stormglass.ts
├── jobs/
│   ├── notificationJob.ts   # 24h booking reminders
│   └── weatherJob.ts        # WEATHER_ALERT for bad conditions
├── emails/                   # React Email templates
│   ├── BookingConfirmationEmail.tsx
│   ├── LessonReminderEmail.tsx
│   ├── WeatherCancellationEmail.tsx
│   └── PaymentReceiptEmail.tsx
└── prisma/
    ├── schema.prisma        # Data models
    └── seed.ts              # Seed data
```

### 3.4 Data Model (Core Entities)

| Entity | Purpose |
|--------|---------|
| **Business** | Tenant; Stripe Connect, subscription, timezone, currency, payment defaults, online booking settings, lat/lng for weather |
| **User** | Roles: Owner, Staff, Instructor; linked to one business |
| **Customer** | CRM records; can be archived |
| **Instructor** | Certification, hourly rate, active flag |
| **Equipment** | Legacy per-item equipment |
| **EquipmentCategory** / **EquipmentVariant** | Category-based inventory (e.g., Softboard, Wetsuit) |
| **Lesson** | Lesson types with price, duration, capacity |
| **Booking** | Lesson bookings; status: Booked, Checked in, Completed, Cancelled, No-show |
| **BookingEquipmentAllocation** | Optional equipment tied to a booking |
| **Rental** | Equipment rentals; status: Pending, Active, Returned, Overdue, Cancelled |
| **Payment** | Payments for rentals/bookings; methods: Cash, EFTPOS, Card, Transfer, Online |
| **Subscription** | Stripe subscription per business |
| **Notification** | Log of sent SMS/email (confirmation, reminder, weather alert, receipt) |
| **WeatherSnapshot** | Cached marine weather (wind, swell, tide) |
| **Integration** | FareHarbor, Stripe, etc. (encrypted config) |

---

## 4. External Integrations

| Integration | Purpose | Configuration |
|-------------|---------|---------------|
| **Stripe** | Subscription billing (69 NZD/mo), Connect for card payments, webhooks | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` |
| **Neon** | PostgreSQL hosting | `DATABASE_URL` |
| **Vercel** | Hosting, serverless functions, Blob storage | Deployment config |
| **Vercel Blob** | Avatar storage | `BLOB_READ_WRITE_TOKEN` |
| **Twilio** | SMS: booking confirmation, 24h reminders | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Resend** | Email: booking confirmation, 24h reminders, payment receipts | `RESEND_API_KEY`, `RESEND_FROM` |
| **Stormglass** | Marine weather (wind, swell, tide) for WEATHER_ALERT | `STORMGLASS_API_KEY` |
| **Upstash Redis** | Rate limiting (30 req/min per IP), idempotency keys | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Gravatar** | Fallback avatars when no custom avatar | No config (MD5 of email) |
| **FareHarbor** | Booking integration (planned) | Integration model exists; config stored encrypted |

---

## 5. Implemented Functionalities

### 5.1 Authentication & Onboarding

- **Credentials Provider:** Email + password; scrypt hashing
- **JWT Strategy:** Session in JWT; `role` and `businessId` in token
- **Session Callback:** Enriches session with avatar (Vercel Blob or Gravatar)
- **Protection:** `requireSession()` in dashboard layout; redirects to `/login` if unauthenticated
- **Onboarding:** After Stripe Checkout, user completes business setup (name, owner, timezone, currency); account and business created

### 5.2 Multi-Tenancy

- Every API route and page uses `session.user.businessId` for tenant scoping
- `resolveBusinessId()` in `api/_lib/tenant.ts` supports session, header (`x-business-id`), or env fallback for development
- All Prisma queries include `where: { businessId }`

### 5.3 Stripe Integration

| Feature | Implementation |
|---------|----------------|
| **Checkout** | POST `/api/stripe/checkout` creates subscription session (30-day trial, 69 NZD/mo) |
| **Portal** | Stripe Customer Portal for subscription management |
| **Connect** | OAuth flow for businesses to accept card payments; `chargesEnabled` + `payoutsEnabled` required for online booking "Pay now" |
| **Webhooks** | `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `checkout.session.completed` |
| **Payment Intents** | For rentals and bookings; currency-aware formatting (NZD, USD, EUR, GBP, AUD) |
| **canAcceptPayments** | Requires `stripeAccountId` + `chargesEnabled` + `payoutsEnabled`; payment settings hint when not connected |

### 5.4 Public Booking Flow

| Step | Implementation |
|------|----------------|
| **School lookup** | GET `/api/public/schools/[slug]` — Returns business, lessons, equipment; respects `onlineBookingEnabled` |
| **Slots** | GET `/api/public/schools/[slug]/slots` — lessonId, date; past dates rejected (400); 60s cache via `unstable_cache` |
| **Create booking** | POST `/api/public/schools/[slug]/bookings` — Idempotency key support; transaction-scoped overlap/equipment checks |
| **Checkout** | POST `/api/public/schools/[slug]/checkout` — Creates Stripe Checkout session for Pay now |
| **Confirmation** | GET `/api/public/schools/[slug]/confirmation` — Validates Stripe session `businessId`; uses `status: "PAID"` |

### 5.5 Notifications

| Type | Channel | Trigger |
|------|---------|---------|
| **BOOKING_CONFIRMATION** | Email (Resend) | After booking created |
| **BOOKING_REMINDER** | SMS (Twilio) + Email (Resend) | 24h before lesson; cron at 08:00 UTC daily |
| **WEATHER_ALERT** | SMS/Email | When wind ≥25kt or swell ≥2m; cron at 06:00 UTC daily |
| **PAYMENT_RECEIPT** | Email (Resend) | After Stripe payment succeeds |

### 5.6 Weather Engine

- **Stormglass API:** Wind, swell, tide at business coordinates
- **WeatherSnapshot:** 1-hour cache to reduce API usage
- **WeatherService:** `getCachedOrFetchWeather()`; `buildWeatherAlertMessage()`
- **weatherJob:** Fetches 24h forecast; sends WEATHER_ALERT when conditions unsafe
- **Cron:** `/api/cron/weather` — 06:00 UTC daily (Vercel Hobby: 1x/day)

### 5.7 Equipment Availability

- `lib/equipment-availability.ts` computes in-use quantities per variant from active/overdue rentals and bookings
- Used on Equipment page and during booking creation (transaction-scoped checks)
- Supports legacy per-item `Equipment` and category-based `EquipmentCategory` / `EquipmentVariant`

### 5.8 Rate Limiting & Idempotency

| Feature | Implementation |
|---------|----------------|
| **Rate limit** | Middleware on `/api/public/*`; 30 req/min per IP (Upstash sliding window); optional (skips if Upstash not configured) |
| **Idempotency** | Booking creation accepts `Idempotency-Key` header or `idempotencyKey` in body; 24h TTL in Upstash; optional (skips if Upstash not configured) |
| **Slots cache** | 60-second `unstable_cache` for slots query to reduce DB load |

---

## 6. How to Use the Software

### 6.1 Getting Started (Development)

1. **Install dependencies:** `npm install`
2. **Set up env vars** (copy `.env.example` to `.env`):
   - `DATABASE_URL` — Neon PostgreSQL
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`
   - Stripe keys, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
   - Optional: Twilio, Resend, Stormglass, Upstash
3. **Run migrations:** `npx prisma migrate dev`
4. **Seed database:** `npm run db:seed`
5. **Start dev server:** `npm run dev`
6. **Login:** `owner@tidedesk.local` / `ChangeMe123!`

### 6.2 Access Flow (End Users)

1. **Landing Page** (`/`) — Marketing with Hero, Features, Pricing; "Start 30-Day Free Trial" → Stripe Checkout
2. **Onboarding** (`/onboarding`) — After checkout: business name, owner, email, password, timezone, currency
3. **Login** (`/login`) — Returning users sign in with email/password
4. **Dashboard** — All app routes require authentication; redirect to `/login` if unauthenticated
5. **Public Booking** (`/book/[slug]`) — No login; customers book lessons directly

### 6.3 Navigation (Authenticated Users)

| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview: customers count, active rentals, today's bookings, today's revenue, equipment out |
| `/customers` | CRM: list, search, filter (active/archived), sort; create, edit, archive |
| `/rentals` | Rentals: list by status; create, return, cancel; pay via Stripe when Pending |
| `/bookings` | Bookings: list by status; create, check-in, complete, no-show, cancel; pay via Stripe when unpaid |
| `/equipment` | Categories and variants; create category/variant; view availability |
| `/instructors` | Add/edit instructors; certification, hourly rate; toggle active |
| `/revenue` | Today/week/month revenue; rental vs lesson breakdown; 14/30-day chart |
| `/settings` | Account (avatar), Business profile, Billing, Online booking, Payment (Stripe Connect, default method), Integrations |

### 6.4 Key User Interactions

- **Customers:** Create via dialog; edit inline; archive/unarchive; search by name, email, phone; paginate
- **Rentals:** Create with customer + equipment; filter by status; return, cancel; pay (Stripe) when Pending; inline error display instead of alert
- **Bookings:** Create with customer, lesson, instructor, time window; optional equipment allocations; check-in, complete, no-show, cancel; pay (Stripe) when unpaid; inline error display
- **Equipment:** Create category; create variants with sizes; set quantities and low-stock thresholds; view available vs in-use
- **Instructors:** Add instructor; certification, hourly rate; toggle active
- **Revenue:** Toggle 14/30-day chart; rental vs lesson breakdown
- **Settings:** Upload avatar; edit business profile (City/Region, lat/lng validation); Online booking (enable/disable, message, hours); Stripe Connect; default payment method

### 6.5 Roles

| Role | Access |
|------|--------|
| **Owner** | Full access; typically created during onboarding |
| **Staff** | Same access as Owner for day-to-day operations |
| **Instructor** | Can be assigned to lessons; role stored for future UI restrictions |

---

## 7. Improvements & Audit Fixes

### 7.1 Public Booking Audit (Sprint 1)

| Issue | Fix |
|-------|-----|
| Race condition (double-booking) | Overlap and equipment checks moved inside transaction |
| Past date slots | Reject past dates with 400 |
| N+1 on slots API | Batched queries (2 instead of per-slot) |
| Stripe confirmation validation | `businessId` checked; explicit `status: "PAID"` |
| Empty lessons/equipment UI | Clear "no lessons available" / "equipment not set up" messages |
| Name length limits | Max 200 chars on booking form |

### 7.2 Infrastructure & Performance

| Improvement | Implementation |
|-------------|----------------|
| **Rate limiting** | Upstash middleware 30 req/min on `/api/public/*` |
| **Slots cache** | 60s `unstable_cache` for bookings query |
| **Idempotency** | `Idempotency-Key` for booking creation; 24h TTL |
| **Timezone note** | Shown on booking form for multi-region clarity |

### 7.3 Stripe Polish

| Improvement | Implementation |
|-------------|----------------|
| **Inline errors** | Pay buttons show inline errors instead of `alert()` |
| **Currency formatting** | `formatCurrency()` supports NZD, USD, EUR, GBP, AUD, BRL |
| **Payment settings hint** | When Stripe not connected, Settings shows guidance |
| **canAcceptPayments** | Requires `payoutsEnabled` in addition to `chargesEnabled` for public booking Pay now |

### 7.4 Business Profile

| Improvement | Implementation |
|-------------|----------------|
| **Layout sections** | Clear sections (City/Region, coordinates) |
| **Coordinate validation** | Lat/lng validated |
| **Alignment fixes** | Form layout polish |

### 7.5 Rental Cancellation

- PENDING and ACTIVE rentals can now be cancelled (previously limited)

---

## 8. Cron Jobs

| Cron | Path | Schedule | Purpose |
|------|------|----------|---------|
| **Notifications** | `/api/cron/notifications` | 08:00 UTC daily | Send 24h booking reminders (SMS + email) |
| **Weather** | `/api/cron/weather` | 06:00 UTC daily | Fetch weather; send WEATHER_ALERT if unsafe |

**Note:** Vercel Hobby plan allows 1 cron invocation per day per job. Use `CRON_SECRET` in `Authorization: Bearer` header to secure endpoints.

---

## 9. Deployment

| Item | Details |
|------|---------|
| **Platform** | Vercel |
| **Database** | Neon PostgreSQL |
| **Migrations** | `npx prisma migrate deploy` |
| **Seed** | `npm run db:seed` (optional) |
| **Environment** | See `.env.example` and `DEPLOYMENT.md` |

Key env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, Stripe keys, `STRIPE_WEBHOOK_SECRET`, plus optional Twilio, Resend, Stormglass, Upstash, Vercel Blob.

See **DEPLOYMENT.md** for Stripe setup and Auth/Vercel configuration.

---

## 10. Summary

TideDesk is a production-ready, multi-tenant SaaS application for surf schools and equipment rental businesses. It provides:

- **CRM, rentals, bookings, equipment, instructors, revenue** in a single dashboard
- **Public online booking** with embed support, Stripe Pay now or Pay later
- **Notifications** via SMS (Twilio) and Email (Resend): confirmation, 24h reminders, payment receipts
- **Weather engine** with Stormglass and WEATHER_ALERT for unsafe conditions
- **Stripe Connect** for online card payments with currency-aware formatting
- **Rate limiting, idempotency, slots caching** for production readiness
- **Online booking settings** (enable/disable, custom message, business hours)

The application is built with Next.js 16, React 19, Prisma, Stripe, and deployed on Vercel with automated cron jobs for reminders and weather alerts.
