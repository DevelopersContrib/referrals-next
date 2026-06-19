# Task List 

**Project:** Referrals.com (referrals-next)
**Sprint focus:** Security, billing UX, and account API
**Created:** June 20, 2026

---

## K1 — Admin Security Guard (3 hours) — CRITICAL

**Goal:** Prevent non-admin members from accessing admin routes and APIs.

### Problem

All 28 `/api/admin/*` routes and 27 `/admin` pages only check for a valid session (`session?.user?.id`). Any logged-in member can access the full admin panel and APIs. A helper `requirePlatformAdminApi()` already exists in `src/lib/require-platform-admin.ts` but is never called.

### Tasks

- [ ] Read `src/lib/require-platform-admin.ts` and `src/lib/platform-admin.ts` to understand the existing admin check logic
- [ ] Add `requirePlatformAdminApi()` call to **every** route handler in `src/app/api/admin/`:
  - `stats/route.ts`
  - `members/route.ts` (GET, POST)
  - `members/[memberId]/route.ts` (GET, PUT, DELETE)
  - `members/[memberId]/impersonate/route.ts`
  - `brands/route.ts`
  - `brands/[brandId]/route.ts` (GET, PUT, DELETE)
  - `campaigns/route.ts`
  - `campaigns/[campaignId]/route.ts` (GET, PUT, DELETE)
  - `participants/route.ts`
  - `plans/route.ts` (GET, POST)
  - `plans/[planId]/route.ts` (GET, PUT, DELETE)
  - `payments/route.ts`
  - `api-keys/route.ts` (GET, DELETE)
  - `settings/route.ts` (GET, PUT)
  - `blog/route.ts` (GET, POST, DELETE)
  - `blog/generate/route.ts`
  - `emails/route.ts`
  - `email-templates/route.ts`
  - `coupons/route.ts`
  - `contests/route.ts`
  - `deals/route.ts` (GET, DELETE)
  - `reviews/route.ts` (GET, PUT, DELETE)
  - `testimonials/route.ts` (GET, PUT, DELETE)
  - `subdomains/route.ts` (GET, DELETE)
  - `forum/route.ts` (GET, DELETE)
  - `integrations/route.ts`
  - `cron/[jobName]/run/route.ts`
- [ ] Update `src/app/(admin)/layout.tsx` to add a server-side admin role check:
  - Call `auth()` to get session
  - Use `memberIdIsPlatformAdmin()` from `src/lib/platform-admin.ts`
  - Redirect non-admins to `/dashboard` with appropriate error
- [ ] Test: log in as a regular member and confirm `/admin` redirects and `/api/admin/*` returns 403

### Files to modify

- `src/app/(admin)/layout.tsx`
- All files under `src/app/api/admin/` (28 route files)

### Reference

- `src/lib/require-platform-admin.ts` — existing helper
- `src/lib/platform-admin.ts` — `memberIdIsPlatformAdmin()`, `emailIsPlatformAdmin()`
- `.env` — `ADMIN_EMAILS`, `ADMIN_MEMBER_IDS`

---

## K2 — Activate Middleware (2 hours) — CRITICAL

**Goal:** Wire the existing proxy logic as proper Next.js middleware for edge-level auth.

### Problem

`src/proxy.ts` contains auth-redirect logic (cookie check, public route allowlist, redirect to `/signin`) but is **not exported as middleware**. There is no `middleware.ts` file. Route protection currently relies on each page calling `auth()` individually, which is inconsistent.

### Tasks

- [ ] Read `src/proxy.ts` to understand the existing logic
- [ ] Create `src/middleware.ts` that imports and uses the proxy function
- [ ] Export `config.matcher` from `src/proxy.ts` (already defined there)
- [ ] Review the public route allowlist in `proxy.ts`:
  - Remove `/signup/affiliate` (no page exists)
  - Verify all public prefixes and exact routes match actual pages
- [ ] Add admin route protection at the middleware level:
  - `/admin/*` routes should check for admin role (note: JWT payload may need `isAdmin` claim — check if it's already there from `src/lib/auth.ts`)
- [ ] Test:
  - Unauthenticated user hitting `/dashboard` → redirects to `/signin`
  - Unauthenticated user hitting `/billing` → redirects to `/signin`
  - Authenticated non-admin hitting `/admin` → redirects to `/dashboard`
  - All public routes (`/`, `/pricing`, `/signin`, `/api/v1/*`, `/widget/*`, etc.) remain accessible

### Files to create/modify

- **Create:** `src/middleware.ts`
- **Modify:** `src/proxy.ts` (cleanup allowlist)

### Reference

- Next.js 16 middleware docs in `node_modules/next/dist/docs/`
- `src/lib/auth.ts` — JWT callback already sets `token.isAdmin`

---

## K3 — Create Account API Routes (2 hours) — HIGH

**Goal:** Build the API endpoints that the account settings form already calls.

### Problem

`src/app/(dashboard)/account/account-form.tsx` makes fetch calls to `/api/account` (GET/PUT) and `/api/account/password` (POST). Neither route exists — they return 404.

### Tasks

- [ ] Read `src/app/(dashboard)/account/account-form.tsx` to understand the expected request/response format
- [ ] Create `src/app/api/account/route.ts`:
  - `GET` — return current member profile (name, email, photo)
  - `PUT` — update name, email, photo (with session auth)
- [ ] Create `src/app/api/account/password/route.ts`:
  - `POST` — accept `{ currentPassword, newPassword }`
  - Verify current password (bcrypt compare, same pattern as auth.ts)
  - Hash new password with bcrypt and update
  - Return success/error
- [ ] Add input validation (zod or manual):
  - Email format
  - Password minimum length
  - Name not empty
- [ ] Test via the `/account` page in the dashboard

### Files to create

- `src/app/api/account/route.ts`
- `src/app/api/account/password/route.ts`

### Reference

- `src/app/(dashboard)/account/account-form.tsx` — the form that calls these
- `src/lib/auth.ts` — bcrypt comparison pattern (line 28)
- `prisma/schema.prisma` — `members` model (line 495)

---

## K4 — Billing Cancel + Reactivate UI (2 hours) — HIGH

**Goal:** Add cancel/reactivate buttons and error handling to the billing page.

### Problem

- `/api/billing/cancel` and `/api/billing/reactivate` exist but no UI uses them
- PayPal execute route redirects to `/billing?error=...` on failure but the billing page never reads or displays query params
- No dedicated cancel confirmation UX

### Tasks

- [ ] Read `src/app/(dashboard)/billing/page.tsx` to understand current layout
- [ ] Read `src/app/api/billing/cancel/route.ts` and `reactivate/route.ts` for expected payloads
- [ ] Add to billing page:
  - **Cancel Subscription** button (visible when member has active paid plan)
  - Confirmation dialog before cancel ("Are you sure? You'll lose access to publishing and extra brands at the end of your billing period.")
  - Call `POST /api/billing/cancel` with member's agreement ID
  - Show success toast on cancel
  - **Reactivate** button (visible when plan is cancelled but not yet expired)
  - Call `POST /api/billing/reactivate`
- [ ] Add error banner:
  - Read `searchParams.error` from URL
  - Display in a red alert at the top of the page
  - Clear on dismiss
- [ ] Test full flows: subscribe → cancel → reactivate → verify plan status updates

### Files to modify

- `src/app/(dashboard)/billing/page.tsx`

### Reference

- `src/app/api/billing/cancel/route.ts`
- `src/app/api/billing/reactivate/route.ts`
- `src/lib/paypal.ts` — `cancelSubscription()`

---

## K5 — PayPal Webhook Signature Verification (1 hour) — HIGH

**Goal:** Validate incoming PayPal webhooks are genuinely from PayPal.

### Problem

`/api/billing/webhook` accepts any POST with the right JSON shape. An attacker could forge subscription activation or payment events.

### Tasks

- [ ] Read `src/app/api/billing/webhook/route.ts` for current handler
- [ ] Read PayPal webhook verification docs (REST API: `POST /v1/notifications/verify-webhook-signature`)
- [ ] Add verification step at the top of the webhook handler:
  - Extract PayPal headers (`PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-TIME`, `PAYPAL-TRANSMISSION-SIG`, `PAYPAL-CERT-URL`, `PAYPAL-AUTH-ALGO`)
  - Call PayPal verify endpoint with the webhook ID (store `PAYPAL_WEBHOOK_ID` in `.env`)
  - If verification fails, return 401
- [ ] Add `PAYPAL_WEBHOOK_ID` to `.env` (get from PayPal dashboard)
- [ ] Test with PayPal sandbox webhook simulator

### Files to modify

- `src/app/api/billing/webhook/route.ts`
- `src/lib/paypal.ts` (add verify helper)

### Reference

- PayPal docs: Verify Webhook Signature
- `src/lib/paypal.ts` — existing PayPal client setup

---

## K6 — Fix Admin Cron Job Mapping (1.5 hours) — MEDIUM

**Goal:** Align admin cron UI with actual cron route names.

### Problem

The admin cron page (`/admin/cron`) and `/api/admin/cron/[jobName]/run` reference job names that don't match the real cron routes:

| Admin UI name | Actual route |
|---------------|--------------|
| `expire-plans` | `/api/cron/plan-expiry` |
| `process-payments` | `/api/cron/update-payments` |
| `send-reminders` | Does not exist |
| `cleanup-tokens` | Does not exist |
| `sync-analytics` | `/api/cron/update-impressions` (partial) |

### Tasks

- [ ] Read `src/app/(admin)/admin/cron/page.tsx` to see job name list
- [ ] Read `src/app/api/admin/cron/[jobName]/run/route.ts` to see the dispatch logic
- [ ] Fix the mapping — two approaches (pick one):
  - **Option A:** Update admin cron UI and API to use the correct route names
  - **Option B:** Add aliases in the cron run API that map old names to real endpoints
- [ ] For truly missing jobs (`send-reminders`, `cleanup-tokens`):
  - Either create stub cron routes or remove from the UI
  - `cleanup-tokens` could clear expired `member_tokens` rows
  - `send-reminders` could be a plan-expiry-soon reminder (7 days before expiry)
- [ ] Test: manually trigger each cron from admin UI and verify it succeeds

### Files to modify

- `src/app/(admin)/admin/cron/page.tsx`
- `src/app/api/admin/cron/[jobName]/run/route.ts`
- Optionally create new cron routes

### Reference

- `src/app/api/cron/` — 5 existing cron routes
- `vercel.json` — cron schedule definitions

---

## K7 — Secure or Remove `/api/checksocial` (1 hour) — MEDIUM

**Goal:** Eliminate unauthenticated email enumeration.

### Problem

`/api/checksocial` accepts a GET with an email parameter and returns whether that email exists in the system — without any authentication. This lets attackers enumerate registered email addresses.

### Tasks

- [ ] Read `src/app/api/checksocial/route.ts` to understand usage
- [ ] Determine if this endpoint is used anywhere in the frontend (search for `checksocial` in codebase)
- [ ] If used: add session auth requirement (`auth()` check)
- [ ] If not used: delete the route file
- [ ] If it's needed publicly (e.g., signup duplicate check): rate-limit or return a generic response that doesn't confirm/deny existence
- [ ] Test: confirm signup flow still works after changes

### Files to modify/delete

- `src/app/api/checksocial/route.ts`

---


