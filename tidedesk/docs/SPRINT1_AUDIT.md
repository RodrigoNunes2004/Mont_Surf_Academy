# Sprint 1 – Public Booking Page | Audit Report

**Date:** March 8, 2025  
**Status:** Completed with fixes applied

---

## Summary

The public booking feature was audited end-to-end. Several issues were identified and fixed. The flow works; slots may be slow under load (optimization recommended for Sprint 2).

---

## 1. API Routes Audit

### GET `/api/public/schools/[slug]`
| Check | Status |
|-------|--------|
| Slug validation | OK |
| 404 when business not found | OK |
| Sensitive data excluded | OK (no user emails, internal IDs) |
| Empty lessons/equipment | OK (returns empty arrays) |

### GET `/api/public/schools/[slug]/slots`
| Check | Status |
|-------|--------|
| Required params (lessonId, date) | OK |
| Invalid date handling | OK |
| Past date rejection | FIXED – now returns 400 for past dates |
| Date parsing (timezone) | FIXED – uses `dateStr + "T12:00:00"` for local date |
| Lesson/business validation | OK |
| N+1 queries | FIXED – now 2 batched queries instead of per-slot queries |

### POST `/api/public/schools/[slug]/bookings`
| Check | Status |
|-------|--------|
| Input validation | OK |
| Name length limits | FIXED – max 200 chars |
| Race condition (double-booking) | FIXED – overlap checks moved inside transaction |
| Equipment re-validation in tx | FIXED – equipment checked inside transaction |
| Customer create/find by email | OK |
| Error messages | OK (SLOT_TAKEN, SLOT_FULL, EQUIPMENT_UNAVAILABLE) |

### POST `/api/public/schools/[slug]/checkout`
| Check | Status |
|-------|--------|
| Booking ownership (businessId) | OK |
| Stripe Connect validation | OK |
| Already-paid check | OK |
| Success/cancel URLs | OK (include slug) |

### GET `/api/public/schools/[slug]/confirmation`
| Check | Status |
|-------|--------|
| bookingId / session_id | OK |
| Stripe session → bookingId | OK |
| Session businessId validation | FIXED – ensures session matches school |
| Paid status | FIXED – uses `findFirst` with `status: "PAID"` |

---

## 2. UI Components Audit

### PublicBookingForm
| Check | Status |
|-------|--------|
| No instructors | OK – shows “not set up” message |
| No lessons | FIXED – shows “no lessons available” |
| No board/wetsuit variants | FIXED – shows “equipment not set up” |
| Unused imports | FIXED – ChevronRight, ChevronLeft removed |
| Error display | OK |
| Loading states | OK |
| Form validation | OK (canAdvance) |

### Booking Page & Confirmation
| Check | Status |
|-------|--------|
| 404 for invalid slug | OK |
| Embed mode (`?embed=1`) | OK |
| Confirmation data fetch | OK |

---

## 3. Database & Concurrency

| Check | Status |
|-------|--------|
| Transaction scope | OK – booking + allocations + payment atomic |
| Race condition prevention | FIXED – instructor/capacity/equipment re-checked in tx |
| Equipment availability in tx | FIXED |
| Idempotency | N/A – each booking is new |

---

## 4. Security

| Check | Status |
|-------|--------|
| No auth required (by design) | OK |
| Business isolation | OK – slug resolves business, all queries use businessId |
| Input sanitization | OK – trim, length limits |
| Stripe session validation | FIXED – businessId checked |
| SQL injection | OK – Prisma parameterized |
| Rate limiting | Not implemented – consider for production |

---

## 5. Manual Testing

| Flow | Result |
|------|--------|
| Load `/book/tidedesk-demo` | OK |
| Lesson dropdown | OK (Beginner, Private lessons) |
| Date picker | OK |
| Board/wetsuit dropdowns | OK |
| Slots for future date | Slower response – may need optimization |

---

## 6. Fixes Applied

1. **Bookings API**
   - Moved instructor/capacity overlap checks inside transaction.
   - Moved equipment availability checks inside transaction.
   - Added name length limits (200 chars).
   - Handled SLOT_TAKEN, SLOT_FULL, EQUIPMENT_UNAVAILABLE, INVALID_EQUIPMENT.

2. **Slots API**
   - Reject past dates with 400.
   - Improved date parsing for `YYYY-MM-DD`.

3. **Confirmation API**
   - Validate Stripe session `businessId` matches school.
   - Use explicit `status: "PAID"` when checking payment.

4. **UI**
   - Empty lessons message.
   - Empty equipment message.
   - Removed unused imports.

5. **Slots API**
   - Replaced N+1 per-slot queries with 2 batched queries (instructor bookings + lesson bookings for the day).

---

## 7. Recommendations for Sprint 2

- Optimize slots API (e.g. batch instructor overlap checks, caching).
- Add rate limiting for public APIs.
- Add optional email confirmation.
- Consider timezone handling for businesses in multiple regions.
