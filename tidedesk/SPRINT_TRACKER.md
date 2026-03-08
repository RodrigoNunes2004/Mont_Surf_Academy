# TideDesk — Sprint Tracker

**Last updated:** March 8, 2026

---

## ✅ Completed Sprints & Work

### Sprint 1 — Public Booking Page (Audit)
- **Status:** Complete
- **Scope:** Audit of public booking flow (`/book/[slug]`)
- **Delivered:** Race-condition fixes (transaction-scoped overlap/equipment checks), past-date rejection, N+1 fix on slots API, Stripe session validation, empty-lessons/equipment UI messages
- **Doc:** [SPRINT1_AUDIT.md](./SPRINT1_AUDIT.md)

### Sprint 2 — Weather Engine
- **Status:** Complete
- **Scope:** Marine weather for surf schools (wind, swell, tide)
- **Delivered:** Stormglass API, WeatherSnapshot model, weather service with 1h cache, WEATHER_ALERT notifications, cron jobs (daily for Hobby plan)
- **Doc:** [WEATHER_ENGINE.md](./WEATHER_ENGINE.md)

### Infrastructure & UX
- **Vercel deployment:** Linked to `tidedesk`; crons set to once daily (Hobby plan limit)
- **Rental cancel fix:** PENDING and ACTIVE rentals can be cancelled
- **Business profile form:** Layout sections, labels (City/Region, lat/lng), validation for coordinates, alignment fixes

---

## 🎯 Next Sprint Candidates

### Option A — Email Notifications (High impact)
- **Goal:** Booking confirmation + 24h reminders via email
- **Scope:** Resend or SendGrid integration; wire to `notificationJob`
- **Deps:** API keys in env

### Option B — Online Booking Settings
- **Goal:** Control how public booking behaves per business
- **Scope:** Enable/disable online booking, custom messages, business hours
- **Deps:** DB fields on Business, settings UI

### Option C — Public API & Performance (Sprint 1 follow-up)
- **Goal:** Harden public booking for production load
- **Scope:** Rate limiting, slots API optimization (caching, batch checks), optional email confirmation
- **Doc:** SPRINT1_AUDIT.md § Recommendations for Sprint 2

### Option D — Stripe Payments Polish
- **Goal:** Finish payment flow for rentals/bookings
- **Scope:** Payment settings form, Connect flow, default payment method
- **Note:** Stripe Connect already integrated; polish UX and edge cases

---

## Quick Reference

| Area            | Status       | Notes                                            |
|-----------------|-------------|--------------------------------------------------|
| Public booking  | Done + audit | Race fixes, validation, confirmation fixes       |
| Weather engine  | Done        | Stormglass, WEATHER_ALERT, daily cron            |
| SMS reminders   | Done        | 24h booking reminder via Twilio (if configured) |
| Email reminders | Pending     | Not yet implemented                              |
| Vercel deploy   | Done        | Crons: notifications 8am UTC, weather 6am UTC    |
| Business form   | Done        | Sections, validation, lat/lng                   |

---

## Suggested Order

1. **Email notifications** — completes the reminder/confirmation story
2. **Online booking settings** — per-business control
3. **Rate limiting + slots optimization** — production hardening
