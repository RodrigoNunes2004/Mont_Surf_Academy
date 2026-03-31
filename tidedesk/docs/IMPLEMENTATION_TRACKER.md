# TideDesk Implementation Tracker

Track what's done vs planned for each plan tier. Aligns with the three pricing cards (Starter, Pro, Premium).

**Legend:** ✅ Done | 🔶 Partial | 🔲 Planned  
**Effort:** S (1–2 days) | M (3–5 days) | L (1–2 weeks)

---

## Starter — $69 NZD/month

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| 1 | CRM & customers | ✅ | — | Search, filter, archive, notes |
| 2 | Bookings & rentals | ✅ | — | Create, check-in, complete, cancel, bulk actions |
| 3 | Payments | ✅ | — | Manual (cash, EFTPOS, card, transfer), Stripe Connect |
| 4 | Dashboard | ✅ | — | Today's metrics, revenue, equipment out |
| 5 | Equipment tracking | ✅ | — | Categories, variants, availability |
| 6 | Instructor management | ✅ | — | CRUD, assign to lessons |
| 7 | Revenue charts | ✅ | — | Daily, weekly, monthly views |

**Starter:** 7/7 done · **Maturity: 100%**

---

## Pro — $129 NZD/month

| # | Feature | Status | Priority | Effort | Notes |
|---|---------|--------|----------|--------|-------|
| 1 | Everything in Starter | ✅ | — | — | Inherited |
| 2 | Weather intelligence | ✅ | — | — | Stormglass API, marine forecast, WEATHER_ALERT cron |
| 3 | SMS notifications | ✅ | — | — | Twilio: confirmation, 24h reminders |
| 4 | Booking widget (embeddable) | ✅ | — | — | `/book/[slug]`, `?embed=1` |
| 5 | Deposit payments | ✅ | — | — | Lesson.depositAmount, Booking.depositPaid/balanceRemaining, Stripe sessions |
| 6 | Instructor portal | ✅ | — | — | Restricted UI for INSTRUCTOR role |
| 7 | CSV export | ✅ | — | — | Customers, bookings, revenue (Pro+ gated) |

**Pro:** 7/7 done · **Maturity: 100%**

**Technical Scope — Deposit payments (done):**
- Schema: `Lesson.depositAmount`, `Booking.depositPaid`, `Booking.balanceRemaining`
- Stripe: Separate Checkout sessions for deposit vs full vs balance
- Dashboard: Pay deposit / Pay full / Pay balance buttons
- Widget: Pay full vs Pay deposit now (rest on arrival) option

---

## Premium — $199 NZD/month

| # | Feature | Status | Priority | Effort | Notes |
|---|---------|--------|----------|--------|-------|
| 1 | Everything in Pro | ✅ | — | — | Inherited |
| 2 | WindGuru integration | ✅ | Medium | S | Marine forecast (wind/swell) on Dashboard, Bookings, Beach; optional WindGuru spot link |
| 3 | Offline mode | 🔲 | Medium | L | PWA service worker, work offline |
| 4 | Advanced analytics | ✅ | Medium | M | /analytics: revenue, bookings, students, instructors, equipment, alerts |
| 5 | POS beach mode | ✅ | High | M | Tablet UI for quick rental, check-in, return |
| 6 | API access | ✅ | High | L | REST API, webhooks; unlocks ecosystem integrations |
| 7 | White label | 🔶 | Low | M | Premium public booking + confirmation pages use school branding/logo; custom domain still planned |
| 8 | Integrations (FareHarbor) | 🔲 | Low | L | External booking sync |

**Premium:** 5/8 done, 2 planned · **Maturity: ~63%**


## Recommended Sprint Order

Based on impact vs difficulty.

| Sprint | Scope | Status | Priority | Effort | Impact |
|--------|-------|--------|----------|--------|--------|
| ~~10~~ | ~~Deposit payments~~ | ✅ Done | — | — | Higher booking conversions |
| ~~11~~ | ~~API access~~ | ✅ Done | High | L | REST API (`/api/v1/*`), API keys, webhooks; `booking.created`, `payment.succeeded` |
| ~~12~~ | ~~POS beach mode~~ | ✅ Done | High | M | `/beach`: today bookings check-in, active rentals return, quick rental |
| ~~13~~ | ~~Advanced analytics~~ | ✅ Done | — | — | Revenue by day/lesson, bookings, students, instructors, equipment, alerts |
| ~~14~~ | ~~WindGuru integration~~ | ✅ Done | — | — | Marine forecast widget on Dashboard, Bookings, Beach; Stormglass data |
| **15** | White label | 🔶 Partial | Low | M | Public booking branding delivered; custom domain still pending |
| **16** | FareHarbor integration | — | Low | L | External booking imports; more bookings for schools |

---

## Product Maturity

| Plan | Status | Notes |
|------|--------|------|
| Starter | 100% | Core SaaS complete |
| Pro | 100% | All features complete |
| Premium | ~63% | API, POS beach mode, WindGuru, advanced analytics; roadmap for white label |

**Product insight:** TideDesk's strongest differentiator is the combination of **booking + weather intelligence + equipment tracking**. Most booking platforms don't handle surf school logistics — that's the advantage.

---

## Product Metrics

Track these to measure SaaS growth:

| Metric | Description |
|--------|-------------|
| MRR | Monthly recurring revenue |
| Active schools | Paying businesses |
| Bookings processed | Total bookings across all schools |
| Revenue processed | Total payments through platform |

---

## Completed Sprints

- Starter: Full core (CRM, bookings, rentals, payments, dashboard, equipment, instructors, revenue)
- Pro: Weather, SMS, booking widget, instructor portal, CSV export
- Tier architecture: Trial = full access, gating, upgrade/downgrade, Stripe multi-plan
- Landing & pricing: All 3 plans with checkout
- Deposit payments: Lesson.depositAmount, pay deposit/full/balance via Stripe, Pro-gated
- API access: ApiKey/WebhookEndpoint models, Bearer/X-API-Key auth, v1 bookings/customers/payments, webhook dispatch, settings UI (Premium-gated)
- POS beach mode: `/beach` tablet UI; check-in today bookings, return active rentals, quick rental (Premium-gated)
- WindGuru integration: Marine forecast widget (wind/swell) on Dashboard, Bookings, Beach; optional WindGuru spot ID in Settings; Premium-gated
- Advanced analytics: /analytics dashboard; revenue by day/lesson, bookings chart, student metrics, instructor labor %, equipment utilization, smart alerts; DailyAnalytics cron; Premium-gated

---

## Recent Additions (March 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| **In-settings upgrade** | ✅ | Settings → Billing: "Subscribe to Premium" when no subscription; no need to log out and use landing page |
| **Stripe upgrade checkout** | ✅ | POST /api/stripe/checkout/upgrade for logged-in users; links new subscription to existing business |
| **Subscription webhook** | ✅ | checkout.session.completed (subscription mode) creates/updates Subscription when metadata.businessId present |
| **Weather widget fallback** | ✅ | Shows "No forecast data available" instead of vanishing when Stormglass returns empty |
| **Weather API message** | ✅ | Returns message when data empty for better diagnostics |
| **Premium testing checklist** | ✅ | PREMIUM_TESTING_CHECKLIST.md for end-to-end testing |
| **Advanced analytics** | ✅ | /analytics: revenue, bookings, students, instructors, equipment, alerts; DailyAnalytics cron; Premium-gated |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-10 | Initial implementation tracker |
| 2026-03-10 | Added priority, effort, technical scope, sprint order, product metrics, maturity |
| 2026-03-11 | Deposit payments: schema, lesson CRUD, Stripe checkout (deposit/full/balance), booking widget, webhook |
| 2026-03-11 | API access: REST API v1, API keys, webhooks, settings API tab (Premium-gated) |
| 2026-03-11 | POS beach mode: /beach page, check-in, return, quick rental (Premium-gated) |
| 2026-03-11 | WindGuru integration: marine forecast widget, WindGuru spot ID in Settings (Premium-gated) |
| 2026-03-11 | Upgrade flow: /api/stripe/checkout/upgrade for existing users; Billing section shows Subscribe to Premium when no subscription; Stripe webhook links subscription to business; marine forecast empty-state fix |
| 2026-03-11 | In-settings upgrade flow: checkout/upgrade, subscription webhook, BillingSection upgrade UI |
| 2026-03-11 | Weather widget: empty-state fallback, API message when Stormglass returns empty; PREMIUM_TESTING_CHECKLIST |
| 2026-03-16 | Sprint 13: Advanced analytics; /analytics dashboard; revenue, bookings, students, instructors, equipment, alerts; DailyAnalytics cron; Premium-gated |
| 2026-03-16 | Advanced analytics: /analytics dashboard; modules/analytics; DailyAnalytics + cron; Premium-gated |
