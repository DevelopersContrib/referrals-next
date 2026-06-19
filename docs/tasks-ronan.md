# Ronan — Task List 

**Project:** Referrals.com (referrals-next)
**Sprint focus:** Features, integrations, and backend polish
**Created:** June 20, 2026

---

## R1 — Campaign Entry & Reward Emails (3 hours) — HIGH

**Goal:** Actually send the campaign emails that members configure.

### Problem

Each campaign has `campaign_entry_subject/message` (sent when a participant joins) and `reward_notify_subject/message` (sent when a reward is earned). Members configure these in the campaign wizard, but the app never sends them. The SES email helper (`src/lib/ses.ts`) is working — it's used for verification and password reset — but it's not called from the participant signup or reward flows.

### Tasks

- [ ] Read `src/app/api/widget/signup/route.ts` — this is where participants join campaigns
- [ ] Read `src/app/api/widget/reward/route.ts` — this is where rewards are claimed
- [ ] Read `src/lib/ses.ts` — understand the `sendEmail()` function signature
- [ ] In the **signup route**, after successful participant creation:
  - Fetch the campaign's `campaign_entry_subject` and `campaign_entry_message`
  - If both are non-empty, call `sendEmail()` to the participant's email
  - Use the campaign name in the "from" display name
  - Make email sending non-blocking (don't fail the signup if email fails — use try/catch)
- [ ] In the **reward route**, after successful reward creation:
  - Fetch the campaign's `reward_notify_subject` and `reward_notify_message`
  - Similarly send via SES, non-blocking
  - Include reward details (coupon code, redirect URL, etc.) in the email body
- [ ] Also check `campaign_email_content` table — some campaigns have custom email templates per campaign. If templates exist, use those instead of the default subject/message fields
- [ ] Add basic template variable substitution:
  - `{{name}}` → participant name
  - `{{campaign}}` → campaign name
  - `{{reward}}` → reward description (coupon, URL, etc.)
- [ ] Test: create a campaign with entry/reward emails configured, sign up via widget, verify emails arrive

### Files to modify

- `src/app/api/widget/signup/route.ts`
- `src/app/api/widget/reward/route.ts`

### Reference

- `src/lib/ses.ts` — `sendEmail(to, subject, html)`
- `prisma/schema.prisma` — `campaign_email_content` model (line ~109)
- `src/app/api/widget/invite/route.ts` — example of SES usage in widget API

---

## R2 — Fix OAuth Member Creation (1 hour) — MEDIUM

**Goal:** Properly set social signup fields when members sign in via Google/Facebook.

### Problem

In `src/lib/auth.ts`, the `signIn` callback for OAuth providers (Google, Facebook) creates new members but:
- Doesn't set `signedup_social` (should be `"google"` or `"facebook"`)
- Doesn't increment `num_of_logins` on subsequent sign-ins
- Doesn't check `is_verified` (OAuth users should auto-verify)

### Tasks

- [ ] Read `src/lib/auth.ts` lines 82-106 (the `signIn` callback)
- [ ] For **new member creation** (OAuth first-time):
  - Set `signedup_social` to `account.provider` (e.g., `"google"`, `"facebook"`)
  - Set `is_verified: true` (already done)
  - Set `num_of_logins: 1`
- [ ] For **existing member sign-in** (OAuth returning):
  - Increment `num_of_logins` (same as credentials flow)
  - If `is_verified` is false, set it to true (they've proven email ownership via OAuth)
- [ ] Test with Google OAuth:
  - New user → verify `signedup_social` = `"google"` in DB
  - Returning user → verify `num_of_logins` increments

### Files to modify

- `src/lib/auth.ts`

### Reference

- Line 38-40: credentials flow already increments `num_of_logins`
- `prisma/schema.prisma` line 506: `signedup_social String? @db.VarChar(100)`

---

## R3 — Mailchimp Auto-Sync on Signup (2 hours) — MEDIUM

**Goal:** Automatically add new participants to the campaign's connected Mailchimp audience.

### Problem

Mailchimp integration exists: members can connect their API key and list audiences. But when a participant signs up for a campaign, they're never added to Mailchimp — only stored in the local DB.

### Tasks

- [ ] Read `src/lib/integrations/mailchimp.ts` — understand `addSubscriber()` method
- [ ] Read `src/app/api/widget/signup/route.ts` — understand the signup flow
- [ ] Read `prisma/schema.prisma` — `campaign_integrations` model (has `mailchimp_key`, `mailchimp_list`, `mailchimp_allow` fields)
- [ ] After successful participant creation in the signup route:
  - Check if the campaign has a Mailchimp integration (`campaign_integrations.mailchimp_allow` is truthy)
  - If yes, fetch the `mailchimp_key` and `mailchimp_list` from `campaign_integrations`
  - If both exist, call `MailchimpIntegration.addSubscriber()` with the participant's email and name
  - Make it non-blocking — don't fail signup if Mailchimp sync fails
  - Log success/failure for debugging
- [ ] Also add sync in the v1 API signup route (`src/app/api/v1/signups/route.ts`) for API-based signups
- [ ] Test: connect Mailchimp to a campaign, sign up a participant, verify they appear in the Mailchimp audience

### Files to modify

- `src/app/api/widget/signup/route.ts`
- `src/app/api/v1/signups/route.ts`

### Reference

- `src/lib/integrations/mailchimp.ts` — `addSubscriber(listId, email, name)`
- `src/app/api/integrations/mailchimp/route.ts` — existing connection flow

---

## R4 — Fix Billing Execute & Brand Upgrade Flow (1 hour) — MEDIUM

**Goal:** Correct PayPal plan ID storage and fix the brand upgrade flow.

### Problem

1. `/api/billing/execute` stores the internal `planId` (integer) in the `paypal_plan_id` field instead of the actual PayPal subscription plan ID string
2. `/brands/[brandId]/upgrade` links to the plan page but doesn't pass `brandId`, so brand-specific plan upgrades don't track which brand triggered the upgrade

### Tasks

- [ ] Read `src/app/api/billing/execute/route.ts`
- [ ] Fix `paypal_plan_id` storage:
  - The PayPal `subscription_id` comes from query params
  - Use PayPal API to get the subscription's `plan_id` (the PayPal plan ID string like `P-xxx`)
  - Store that in `member_plan.paypal_plan_id` instead of the internal plan ID
- [ ] Read `src/app/(dashboard)/brands/[brandId]/upgrade/page.tsx`
- [ ] Pass `brandId` through the subscribe flow:
  - Add `brandId` as a query param when linking to `/billing/plan/[planId]`
  - In `/api/billing/subscribe`, forward `brandId` to PayPal's `custom_id` or return URL
  - In `/api/billing/execute`, read it back and store in `url_plan` if provided
- [ ] Test: upgrade from brand page → subscribe → verify `paypal_plan_id` and `url_plan` are correct

### Files to modify

- `src/app/api/billing/execute/route.ts`
- `src/app/(dashboard)/brands/[brandId]/upgrade/page.tsx`
- `src/app/(dashboard)/billing/plan/[planId]/page.tsx` (read `brandId` from query)
- `src/app/api/billing/subscribe/route.ts` (forward `brandId`)

### Reference

- `src/lib/paypal.ts` — `getSubscription()` to fetch plan details
- `prisma/schema.prisma` — `member_plan` model, `url_plan` model

---

## R5 — Agent Manifest Accuracy (0.5 hours) — LOW

**Goal:** Make the `.well-known/agent.json` reflect actual API capabilities.

### Problem

The agent manifest declares `authentication: { type: "none" }` but most API endpoints require an API key. The capabilities list only includes 3 endpoints when there are 20+ public API routes.

### Tasks

- [ ] Read `src/app/.well-known/agent.json/route.ts`
- [ ] Read `src/lib/agentCapabilities.ts`
- [ ] Update authentication declaration:
  ```ts
  authentication: {
    type: "apiKey",
    header: "X-API-Key",
    description: "Generate an API key from your dashboard or via POST /api/v1/members/api-key"
  }
  ```
- [ ] Expand capabilities list to include key endpoints:
  - `GET /api/v1/brands` — List brands
  - `POST /api/v1/brands` — Create brand
  - `GET /api/v1/campaigns` — List campaigns
  - `POST /api/v1/campaigns` — Create campaign
  - `GET /api/v1/participants` — List participants
  - `GET /api/v1/campaigns/:id/stats` — Campaign stats
  - `GET /api/v1/members/profile` — Member profile
- [ ] Test: fetch `/.well-known/agent.json` and verify it's valid JSON with correct data

### Files to modify

- `src/lib/agentCapabilities.ts`
- `src/app/.well-known/agent.json/route.ts` (authentication section)

---

## R6 — Env Var Alignment & Documentation (1 hour) — LOW

**Goal:** Fix env var mismatches and create a proper `.env.example`.

### Problem

- Code expects `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` but `.env` has `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET`
- `NEXT_PUBLIC_FACEBOOK_APP_ID` is used in the Facebook tool UI but not in `.env`
- No `.env.example` for new developer onboarding (`.env.local.example` exists but may be outdated)

### Tasks

- [ ] Audit all env var references in the codebase:
  ```
  grep -roh 'process\.env\.\w\+' src/ | sort -u
  ```
- [ ] Fix Shopify integration (`src/lib/integrations/shopify.ts`):
  - Either rename env vars in code to match `.env` (`SHOPIFY_API_KEY`)
  - Or rename `.env` keys to match code (`SHOPIFY_CLIENT_ID`)
  - Pick one and be consistent — check which name the Shopify docs recommend
- [ ] Add `NEXT_PUBLIC_FACEBOOK_APP_ID` to `.env` (get from Facebook Developer Console)
- [ ] Create/update `docs/.env.example` with ALL required env vars:
  - Group by service (Database, Auth, PayPal, AWS, OAuth, Integrations, App)
  - Include descriptions as comments
  - Use placeholder values (never real secrets)
- [ ] Verify `.env.local.example` at project root matches reality, or remove if redundant
- [ ] Test: fresh clone + copy `.env.example` → app starts without missing env errors

### Files to create/modify

- **Create:** `docs/.env.example`
- **Modify:** `src/lib/integrations/shopify.ts` (or `.env` — pick one direction)
- **Modify:** `.env` (add missing keys with empty values)

### Reference

- Shopify docs for env var naming
- Facebook Developer Console for app ID

---

## R7 — PayPal Webhook Signature Verification (1 hour) — HIGH

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

---

## JU8 — Wire Zapier Integration Class (3 hours) — MEDIUM

**Goal:** Replace inline fetch calls with the proper `ZapierIntegration` class and expand webhook event coverage.

### Problem

`src/lib/integrations/zapier.ts` defines a `ZapierIntegration` class with `fireEvent()` helpers and event types (`participant.signup`, `participant.reward`, etc.) but the actual signup and reward routes use inline `fetch` calls instead. Only `participant.signup` events fire — rewards, shares, and other events are never sent to webhooks.

### Tasks

- [ ] Read `src/lib/integrations/zapier.ts` — understand the class and event types
- [ ] Read `src/lib/integrations/base.ts` — understand the `Integration` interface and event definitions
- [ ] In `src/app/api/widget/signup/route.ts`:
  - Replace the inline `fetch` to Zapier webhook URLs with `ZapierIntegration.fireEvent("participant.signup", ...)`
- [ ] In `src/app/api/widget/reward/route.ts`:
  - Add `ZapierIntegration.fireEvent("participant.reward", ...)` after reward creation
- [ ] In `src/app/api/widget/share/route.ts`:
  - Add `ZapierIntegration.fireEvent("participant.share", ...)` after share recording
- [ ] In `src/app/api/v1/signups/route.ts`:
  - Replace inline webhook fetch with the class
- [ ] All webhook calls should be non-blocking (try/catch, don't fail the main action)
- [ ] Test: register a webhook via `/api/v1/webhooks`, trigger a signup, verify payload arrives at the webhook URL

### Files to modify

- `src/app/api/widget/signup/route.ts`
- `src/app/api/widget/reward/route.ts`
- `src/app/api/widget/share/route.ts`
- `src/app/api/v1/signups/route.ts`

### Reference

- `src/lib/integrations/zapier.ts` — `ZapierIntegration` class
- `src/lib/integrations/base.ts` — event type definitions
- `src/app/api/v1/webhooks/route.ts` — webhook registration API

---

## Checklist Summary

| Task | Hours | Priority | Status |
|------|-------|----------|--------|
| JU1 — Campaign entry & reward emails | 3.0 | High | ☐ |
| JU2 — Fix OAuth member creation | 1.0 | Medium | ☐ |
| JU3 — Mailchimp auto-sync on signup | 2.0 | Medium | ☐ |
| JU4 — Fix billing execute & brand upgrade | 1.0 | Medium | ☐ |
| JU5 — Agent manifest accuracy | 0.5 | Low | ☐ |
| JU6 — Env var alignment & docs | 1.0 | Low | ☐ |
| JU7 — PayPal webhook verification | 1.0 | High | ☐ |
| JU8 — Wire Zapier integration class | 3.0 | Medium | ☐ |

