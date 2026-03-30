# TideDesk - Security Audit Summary

**Product:** TideDesk - Management Software for Surf Schools  
**Document Type:** Security audit and hardening summary  
**Revision Date:** 2026-03-30  
**Scope:** Application-layer security review of TideDesk APIs, browser-exposed data, authentication/session handling, cron protection, and browser security headers

---

## 1. Executive Summary

A focused security audit and hardening pass was completed across TideDesk's public booking flow, authenticated dashboard APIs, browser-delivered responses, and scheduled job endpoints.

The work reduced sensitive data exposure in browser-inspectable responses, tightened tenant and role enforcement, added abuse protection to public and auth-facing endpoints, locked down cron routes, and introduced a stricter nonce-based Content Security Policy (CSP) with additional security headers.

The application was also validated with:

- lint checks during implementation
- a successful production build
- a production-mode smoke test using `next build` and `next start`
- browser header and route verification for public, authenticated, and embedded booking paths

This audit materially improves the platform's security posture, but it does **not** imply a guarantee of "100% security". Secure operation still depends on deployment configuration, secret management, Stripe/webhook configuration, and ongoing review.

---

## 2. Audit Goals

The audit focused on the following concerns:

- reduce exposure of prices, payment metadata, and user data in browser-inspectable API responses
- prevent weak tenant resolution patterns that could allow unsafe cross-tenant access
- ensure instructor users cannot access or mutate owner/staff-only resources
- protect public endpoints from abuse and request flooding
- harden cron endpoints so they cannot run without authorization
- strengthen browser protections against inline script execution and unsafe embedding
- verify production behavior instead of relying only on development mode

---

## 3. Methodology

The audit combined code review, targeted hardening, and runtime validation.

### 3.1 Code Review Areas

- authenticated dashboard APIs under `app/api/*`
- public booking APIs under `app/api/public/*`
- auth/session handling in `lib/auth.ts`
- rate limiting and middleware in `lib/rate-limit.ts` and `middleware.ts`
- cron routes under `app/api/cron/*`
- public confirmation UI and response shaping
- payment, rental, customer, instructor, lesson, business, and user routes

### 3.2 Runtime Validation

- browser inspection of public and authenticated pages
- CSP and security-header verification with direct response-header checks
- production build verification with `next build`
- production smoke test with `next start`

---

## 4. Security Improvements Implemented

### 4.1 API Response Minimization

Several endpoints were changed to return only the fields actually needed by the UI instead of full database records.

#### Reduced exposure in these areas

- `payments` responses now avoid exposing internal Stripe identifiers such as session/payment intent references to the client
- `customers` responses were reduced to safe operational fields
- `instructors` responses were reduced to fields needed for UI and scheduling
- `lessons` responses were reduced to public/operational fields
- `rentals` responses were converted to a safe serializer instead of returning raw records
- `business` responses were shaped to avoid exposing internal fields such as Stripe account details
- `users` responses removed unnecessary tenant linkage from the response payload

#### Security benefit

- less sensitive data visible in browser devtools
- lower blast radius if a client-side component or public API response is inspected
- clearer separation between internal persistence models and public API contracts

---

### 4.2 Stronger Tenant and Role Enforcement

A number of routes previously relied on looser business resolution patterns. These were hardened to require real authenticated session resolution and stricter role checks.

#### Changes made

- several read/write routes were moved from header-style tenant lookup to `resolveSession(...)`
- instructor users were explicitly blocked from protected owner/staff operations using `rejectIfInstructor(...)`
- unauthorized requests now return proper `401` behavior instead of weaker or misleading tenant errors in multiple places

#### Security benefit

- better tenant isolation
- lower risk of cross-tenant access through crafted requests
- clearer authorization boundaries between OWNER/STAFF and INSTRUCTOR roles

---

### 4.3 Authentication and Session Hardening

`lib/auth.ts` was improved to reduce stale session data and remove unnecessary privacy leakage.

#### Changes made

- session `role` and `businessId` are refreshed from the database when the session is built, rather than trusting older token claims alone
- fallback Gravatar hash generation was removed
- if no explicit avatar is available, the session no longer generates a third-party avatar URL derived from the user's email

#### Security and privacy benefit

- reduced stale authorization context after role/tenant changes
- reduced privacy leakage through email-derived avatar hashes

---

### 4.4 Public/Auth Rate Limiting

Rate limiting was expanded and made more granular in `lib/rate-limit.ts` and `middleware.ts`.

#### Changes made

- public API limiter kept at `30 requests / minute`
- auth API limiter added at `10 requests / minute`
- request identification was centralized with `getRequestIdentifier(...)`
- middleware now applies rate limiting to both public and auth API paths

#### Security benefit

- improved protection against login abuse and credential stuffing
- improved protection against scraping or flooding of public booking endpoints

---

### 4.5 Cron Endpoint Authorization

Cron routes were hardened to fail closed when no valid secret is provided.

#### Changes made

- new centralized helper: `lib/server/cron-auth.ts`
- cron routes now use `isAuthorizedCronRequest(...)`
- cron jobs return `401 Unauthorized` if `CRON_SECRET` is missing or invalid

#### Routes covered

- `app/api/cron/analytics/route.ts`
- `app/api/cron/weather/route.ts`
- `app/api/cron/notifications/route.ts`
- `app/api/cron/trial-reminders/route.ts`

#### Security benefit

- prevents unauthenticated triggering of scheduled jobs
- avoids accidental exposure if a cron route is reachable from the public internet

---

### 4.6 Public Booking Confirmation Privacy

The public booking confirmation flow was trimmed to avoid exposing customer personally identifiable information.

#### Changes made

- public confirmation API removed customer contact and identity fields from the public response
- confirmation UI was updated to display a generic booking confirmation message instead of customer identity/contact data

#### Security benefit

- less customer data exposed through public confirmation pages
- reduced privacy risk from shared links, browser inspection, or accidental disclosure

---

### 4.7 Test Webhook Protection

The webhook test receiver was disabled for production use.

#### Change made

- `app/api/webhooks/test-receiver/route.ts` now avoids remaining active as a production logging surface

#### Security benefit

- reduces risk of arbitrary payload logging in production
- removes an unnecessary public-facing debugging surface

---

### 4.8 Browser Security Headers and CSP

Browser hardening was significantly improved through `middleware.ts` and `next.config.ts`.

#### Headers added or strengthened

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### CSP changes

- CSP generation moved to middleware for per-request control
- unique nonce generated per request
- nonce passed via request header for Next.js inline script support
- `script-src` tightened to remove general inline execution
- production CSP includes `upgrade-insecure-requests`
- `/book/*` routes keep special embedding behavior through relaxed `frame-ancestors`
- non-embedded pages remain restricted to `frame-ancestors 'self'`

#### Security benefit

- stronger XSS resistance
- tighter control of browser-side script execution
- safer framing policy with explicit allowance only where embedding is intended

---

### 4.9 Production Build Fix Identified During Validation

The production build surfaced one serializer typing issue that was not apparent during local dev behavior.

#### Change made

- `app/api/rentals/[id]/route.ts` was updated so `toSafeRental(...)` accepts Prisma `Decimal` for `priceTotal`

#### Security and reliability benefit

- production build now passes cleanly
- API response shaping remains intact in real production builds

---

## 5. Routes and Areas Reviewed

This hardening pass included changes in the following major areas:

- `app/api/bookings/*`
- `app/api/business/route.ts`
- `app/api/cron/*`
- `app/api/customers/*`
- `app/api/equipment/*`
- `app/api/instructors/*`
- `app/api/integrations/route.ts`
- `app/api/lessons/*`
- `app/api/payments/*`
- `app/api/public/schools/[slug]/confirmation/route.ts`
- `app/api/rentals/*`
- `app/api/users/*`
- `app/api/webhooks/test-receiver/route.ts`
- `components/book/confirmation-content.tsx`
- `components/settings/business-profile-form.tsx`
- `lib/auth.ts`
- `lib/rate-limit.ts`
- `lib/server/cron-auth.ts`
- `middleware.ts`
- `next.config.ts`

---

## 6. Verification Performed

### 6.1 Browser Checks

The following routes were loaded and checked for breakage after CSP hardening:

- `/`
- `/login`
- authenticated `/dashboard`
- `/book/tidedesk-demo`
- `/book/tidedesk-demo?embed=1`

### 6.2 Header Verification

Direct header inspection confirmed:

- nonce-based CSP is present
- production responses include `upgrade-insecure-requests`
- standard pages use `frame-ancestors 'self'`
- embedded booking uses `frame-ancestors *`

### 6.3 Production Validation

The application was validated in production mode with:

```bash
npm run build
npx next start --port 3001
```

Outcome:

- production build completed successfully after the rental serializer type fix
- production routes rendered successfully
- first-party JS/CSS/font assets loaded successfully

---

## 7. Known Caveats and Remaining Recommendations

### 7.1 Deployment Configuration Still Matters

The local environment still used:

- `NEXTAUTH_URL=http://localhost:3000`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

These values must be updated to the real deployed origin in production.

### 7.2 Upstash Rate Limiting Is Optional

Rate limiting only activates when the required Upstash environment variables are configured. Without them, the application still works, but those protections are not active.

### 7.3 Middleware Convention Warning

Next.js 16 warns that the `middleware` file convention is being deprecated in favor of `proxy`. This is not an immediate security issue, but it should be migrated in a future maintenance pass.

### 7.4 Security Is Ongoing, Not Final

This audit reduced identified risks, but security requires continuous work, including:

- secret rotation and secure environment management
- dependency updates
- webhook verification review
- periodic auth and authorization review
- monitoring and alerting for abuse patterns
- future penetration testing against deployed infrastructure

---

## 8. Overall Conclusion

The TideDesk security audit resulted in meaningful improvements across authentication, authorization, browser hardening, cron protection, and API response minimization.

The most important outcomes were:

- less sensitive data exposed to browser inspection
- stricter protection of authenticated and public endpoints
- tighter role and tenant enforcement
- safer cron execution
- stronger CSP and browser security headers
- successful validation in production build and runtime mode

TideDesk is now materially better protected than before this audit, with the main remaining responsibilities shifting to production environment configuration, ongoing maintenance, and future iterative review.

---

## 9. Revision History

| Date | Change |
|------|--------|
| 2026-03-30 | Initial security audit summary created |

