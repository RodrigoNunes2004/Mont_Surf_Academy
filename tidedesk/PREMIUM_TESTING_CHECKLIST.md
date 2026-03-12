# Premium Plan – End-to-End Testing Checklist

Use this checklist to verify all Premium features work as expected in the browser.

---

## Prerequisites

| Item | Where | Status |
|------|-------|--------|
| Premium or active trial | Stripe → Customer Portal | ✓ Required |
| `STORMGLASS_API_KEY` | Vercel env vars | Needed for marine forecast |
| Business latitude/longitude | Settings → Business | e.g. -37.639, 176.185 (Mount Maunganui) |
| WindGuru spot ID (optional) | Settings → Business | e.g. 53 or 484387 |
| Twilio (optional) | Vercel env vars | For SMS confirmations/reminders |
| Resend | Vercel env vars | For email confirmations/receipts |

---

## 1. Weather Forecast & WindGuru

**Where:** Dashboard, Bookings, Beach

1. Ensure **Settings → Business** has Latitude and Longitude set.
2. Go to **Dashboard** → You should see a "Surf conditions" card with hourly wind (kt) and swell (m).
3. If WindGuru spot ID is set, you should see a "View on WindGuru →" link.
4. Go to **Bookings** → Same marine forecast widget in the sidebar/tab area.
5. Go to **Beach** → Same widget when you have Premium.

**If you see "Set latitude and longitude..."** → Add coordinates in Settings → Business.

**If you see "Failed to load forecast"** → Check `STORMGLASS_API_KEY` in Vercel.

---

## 2. Beach (POS) Page

**Where:** Sidebar → Beach (Premium only)

1. Sidebar should show a **Beach** link.
2. Click it → Beach page loads with:
   - Today's bookings
   - Check-in / return sections
   - Quick rental
   - Marine forecast widget (if windguru enabled)

---

## 3. CSV Export

**Where:** Bookings, Customers, Revenue

1. Go to **Bookings** → Export button (top right).
2. Go to **Customers** → Export button.
3. Go to **Revenue** → Export button.

Click Export → CSV download starts.

---

## 4. API Access

**Where:** Settings → API

1. Go to **Settings → API**.
2. **API Keys:** Create a key → Use in `Authorization: Bearer td_...` for `https://www.tidedesk.co.nz/api/v1` requests.
3. **Webhooks:** Add endpoint URL (e.g. your server). Subscribe to `booking.created`, `payment.succeeded`.
4. Test: `GET /api/v1/customers` with API key.

---

## 5. Messages (SMS & Email)

**Where:** Triggered by actions, not a dedicated UI

| Event | Channel | Trigger |
|-------|---------|---------|
| Booking confirmation | SMS or Email | After online booking with payment |
| Booking reminder | SMS | 24h before lesson (cron) |
| Payment receipt | Email | After Stripe payment |
| Weather alert | SMS or Email | When wind ≥25kt or swell ≥2m (cron) |

**To test:**
- **Booking confirmation:** Create a booking via public booking page, pay → Check phone/email.
- **Weather alert:** Wait for cron or temporarily lower thresholds in `jobs/weatherJob.ts` (WIND_ALERT_KT, SWELL_ALERT_M).
- **Payment receipt:** Complete a paid booking → Check email (Resend).

---

## 6. Plan Switching (Stripe Portal)

**Where:** Settings → Billing

1. Go to **Settings → Billing**.
2. Click **Manage subscription**.
3. In Stripe Portal: Switch plan, update payment, cancel, download invoices.

---

## Quick Test Flow (5 min)

1. Log in → **Dashboard** (see Surf conditions).
2. **Bookings** → Marine forecast + Export.
3. **Beach** → Full POS view.
4. **Settings → API** → Create key, add webhook.
5. **Settings → Billing** → Manage subscription.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No "Surf conditions" | Premium/trial + lat/lng in Settings → Business |
| No Beach link | Premium/trial required |
| "WindGuru requires Premium" | Upgrade via Settings → Billing |
| No Export button | Pro or Premium required |
| No API section | Premium required |
| SMS not received | Check Twilio credentials |
| Email not received | Check Resend, verify domain |
