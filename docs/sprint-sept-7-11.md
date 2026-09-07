# Sprint — Sept 7–11, 2026

**Project:** Referrals.com (referrals-next)
**Window:** Monday Sept 7 – Friday Sept 11, 2026 (5 days)
**Created:** Sept 6, 2026 · **Verified in-repo Sept 6** (do not add unverified tickets)
**Theme:** Close the referral reward loop, then stop selling a lie on $9/mo

One board. **Kareen is not on this sprint.** Jayson = UI. Ronan = API / paywalls / stats / copy.

Do **not** edit `.env`. Do **not** touch PayPal checkout UI (`/billing/plan/[planId]`, `paypal-checkout.tsx`). Shared MySQL: additive SQL only. Public widgets must never 403 visitors just because the owner is `free_capped`. No unique index on `member_urls.slug`.

| Who | Focus | Hours |
|-----|--------|-------|
| **Jayson** | Billing cards + upgrade CTAs (verified broken) | 8.0 |
| **Ronan** | Conversion callback this API can actually receive; then caps / activate | 16.5 |

---

# Verified (read this before coding)

## Conversion loop — the program is half-dead

| Claim | Verdict | Evidence |
|---|---|---|
| Widget signup credits a referrer **if the friend joins in the widget** | **True, partial** | `referral-widget.tsx` reads `?ref=` / `?referrer=` as **numeric participant id** and POSTs `referrerId` to `/api/widget/signup`, which sets `invited_by`. |
| Target-site conversion (ipartner / inspectionservices / affiliate landers) credits the referrer | **Cannot close in this repo** — API is unusable by those sites | Only closer is `POST /api/v1/signups/referral`. It needs a **member `ref_*` key** + body `code` = **base64(`campaign:social:participant`)**. `/t/[code]` does **not** emit that. It 302s to the destination with `?ref=<participantId>` (integer). A worker POSTing that `ref` as `code` → 400. A worker using `NETWORK_READ_KEY` → 401. |
| `/t/` credits the conversion | **False** | `src/app/t/[code]/route.ts` increments **clicks** only. Then redirects. No `invited_by`, no reward. |
| `/api/domain-refer` mints `/t/` links that pay when the friend converts | **Mint yes, pay no** | Comment in `domain-refer/route.ts` promises `$5` when the visitor becomes a lead on `to`. Crediting still requires the broken callback above. |
| Widget signup pays the $5 / coupon | **False** | `/api/widget/signup` never calls reward logic. Rewards live in `/api/v1/signups/referral` (`processReward`) and `/api/widget/reward`. The widget **never POSTs** `/api/widget/reward` (only displays `goalMet`). |
| `/api/brand?domain=` self-serves a campaign | **False** | `in_network: false` unless `member_urls` exists **and** a `publish=public` campaign exists (`resolveTargetCampaign`). No create path. |
| `public/widget.js` vs live loader | **True landmine, not this week’s P0** | Live `/widget.js?campaign=` is rewritten to `/api/legacy/widget-js` (`next.config.ts` `beforeFiles`). Static `public/widget.js` still requires `data-campaign` and would break generated `?campaign=` snippets if the rewrite is removed. |

**Therefore:** Do not ship more widgets until Ronan adds a **network conversion POST** that accepts what `/t/` already puts on the URL (`ref` = participant id), authenticates with a **network key** (not a member key), sets `invited_by`, and fires the same reward path as `signups/referral`. The affiliate-content worker / config-lander are **other repos** — prompt is at the bottom. Cursor does not edit those.

## $9 / caps / billing — verified leftovers

| Claim | Verdict |
|---|---|
| One PayPal payment unlocks all brands | **True.** `getMemberEntitlement` / `canMemberAddBrand` are account-level `isGrowth`. `url_plan` is written in `billing-activation.ts` and **never read** (only deleted on account delete). |
| 500-participant cap is widget-only | **True.** `canMemberAcceptParticipant` is only called from `/api/widget/signup`. Bypass: `POST /api/v1/signups`, Zapier create, `POST .../campaigns/[id]/participants`. |
| PayPal activate if tab closes | **True hole.** Webhook `BILLING.SUBSCRIPTION.ACTIVATED` only stamps `agreement_activate`. `PAYMENT.SALE.COMPLETED` extends expiry **only if** `member_plan` already exists. |
| “30 days Growth when they upgrade” | **True lie.** Copy on `/referral-program` + invite card. `activatePaidSubscription` does not extend the referrer’s `plan_expiry`. `referral_coupons` has **zero** callers. |
| `/billing` dumps raw plans | **True.** `plans.findMany()` + PayPal agreement id. |
| `/stats` charts gated | **True.** `advancedAnalytics = isGrowth`. **Per-campaign table still always rendered.** |
| Second-brand CTA | **True weak.** Analyzer → `/billing`, not `/billing/plan/2`. |
| Dashboard “Upgrade Your Plan” | **True always-on.** No entitlement check. |
| Upgrade banner (Aug J6) | **Already shipped.** `FreeCappedUpgradeCard` in `paid-onboarding-banner.tsx`. Do not retask. |
| Checkout / branding hide | **Working.** Do not retask. |

---

# Jayson — Web UI

## J1 — `/billing` Available Plans look like `/pricing` (3h) — HIGH

Verified: `src/app/(dashboard)/billing/page.tsx` maps the `plans` table.

- Two cards: Free forever $0 vs Growth $9/mo (copy from Ronan **R6** if he has landed R5; until then keep “per brand”)
- Human status: trial / free / paid / cancelled. Do not badge healthy free as Expired
- CTA → existing `/billing/plan/2`. Hide PayPal agreement IDs

## J2 — Domain-cap CTA → checkout (2h) — HIGH

Verified: `brand-analyzer.tsx` links `/billing`.

- `needsUpgrade` → `/billing/plan/2?brandId=` when known
- Do not invent checkout

## J3 — Upgrade nag + orphan page (2h) — MEDIUM

Verified: dashboard card always visible (`dashboard/page.tsx` ~423). `/brands/[brandId]/upgrade` has no inbound links and dumps raw plans.

- Hide dashboard card when `paid`
- Redirect `/brands/[id]/upgrade` → `/billing/plan/2?brandId=`

## J4 — Billing mobile (1h) — MEDIUM

375 / 768: cards stack, 44px CTAs, no page-level horizontal scroll.

---

# Ronan — Close the loop, then the paywalls

## R1 — Network conversion endpoint this API can receive (5h) — CRITICAL

**Why:** `/t/` already drops `?ref=<participantId>` on the destination. Nothing out there can legally POST a conversion today.

Add **one** additive route, e.g. `POST /api/v1/network/conversions` (do not break `signups/referral`).

- Auth: `x-api-key === NETWORK_WRITE_KEY` (new env, same pattern as `NETWORK_READ_KEY`) **or** reuse `NETWORK_READ_KEY` if ops agrees one key is enough. Empty env → 401. Do not use `authenticateApiKey` (member keys).
- Body: `{ email, name, ref, domain? }`  
  - `ref` = integer participant id (**what `/t/` already sets**) **or** the existing base64 share `code`  
  - Resolve campaign from that participant (and optional `domain` must match the campaign’s brand)
- Create/update `campaign_participants` with `invited_by` (same rules as `signups/referral`)
- Call the **same** reward logic (`processReward` — extract, don’t copy-paste 100 lines)
- Idempotent. CORS like other public APIs. GET → 405.
- Widget visitors / `free_capped` owners: do not 403 the converting visitor
- Add `NETWORK_WRITE_KEY` to `.env.local.example` only — not `.env`
- Document the contract at the bottom of this file for the worker prompt

**Done when:** `curl` with the network key + `{ email, name, ref: <id from a /t/ hop> }` → 201, referrer `invited_by` set, reward row if threshold met. Bad key → 401. Unknown ref → 200/400 without leaking other campaigns.

## R2 — `/t/` should leave a cookie the lander can read (1.5h) — HIGH

Verified: `/t/` sets `ref` on the **redirect URL** only (not a cookie) except the platform signup campaign (`rref` cookie).

- Also set a 30-day `ref` (or `rref`) cookie on the **redirect response** when hopping to an external host — `SameSite=None; Secure` if the lander is a different site, otherwise the lander will not see it. If third-party cookies are dead, the query param is the source of truth (R1).
- Do not change click increment behavior

## R3 — Fire reward when the widget loop actually hits the goal (2h) — HIGH

Verified: widget signup sets `invited_by` but never claims a reward.

- After a **new** widget signup with `invited_by`, if the referrer’s count meets `num_signups` / equal-reward, call the shared `processReward` (same as R1)
- Or have the widget POST `/api/widget/reward` for the **referrer** when `goalMet` — server-side is better (don’t trust the client)

**Done when:** Friend joins via widget `?ref=<id>` → referrer gets the reward row without anyone calling v1.

## R4 — Participant cap on every create (2.5h) — CRITICAL

Verified widget-only.

- `assertCanAcceptParticipant` on `/api/v1/signups`, Zapier participant create, `POST .../campaigns/[id]/participants`
- Domain-referrer synthetic participants: **do not** count toward the cap (they are `@network.referrals.com`, not real leads)
- Growth unlimited

## R5 — Webhook calls `activatePaidSubscription` (2.5h) — CRITICAL

Verified: ACTIVATED does not activate.

- Idempotent activate on `BILLING.SUBSCRIPTION.ACTIVATED` / first `PAYMENT.SALE.COMPLETED` if no `member_plan`
- Do not double-enroll engagement
- Do not edit `paypal-checkout.tsx`

## R6 — One pricing story + `/stats` table gate (3h) — HIGH

Verified: per-campaign table always on; 30-day upgrade copy is a lie until you extend `plan_expiry` on pay (park that as follow-up if this week fills up).

- Free `/stats`: totals only — hide per-campaign breakdown
- If R1–R5 slip on “per brand”, remove “per brand” from `/pricing`, invite card, knowledgebase Friday
- If +30d on paid referral does **not** ship, change `/referral-program` to “invitee gets a 14-day trial” (do not promise 30 days)

---

# Hours

| ID | Owner | Hours | Pri | Verified? |
|----|-------|-------|-----|-----------|
| J1 `/billing` cards | Jayson | 3.0 | High | Yes |
| J2 Cap CTA → `/billing/plan/2` | Jayson | 2.0 | High | Yes |
| J3 Upgrade nag / orphan | Jayson | 2.0 | Medium | Yes |
| J4 Billing mobile | Jayson | 1.0 | Medium | Yes |
| **R1 Network conversion POST** | **Ronan** | **5.0** | **Critical** | **Yes** |
| **R2 `/t/` cookie + keep `?ref=`** | **Ronan** | **1.5** | **High** | **Yes** |
| **R3 Widget signup fires reward** | **Ronan** | **2.0** | **High** | **Yes** |
| **R4 Cap all ingress** | **Ronan** | **2.5** | **Critical** | **Yes** |
| **R5 Webhook activate** | **Ronan** | **2.5** | **Critical** | **Yes** |
| R6 Copy + `/stats` table | Ronan | 3.0 | High | Yes |
| **Total** | | **24.5** | | |

Parked (verified but not this week unless R1–R5 finish early): per-brand `url_plan` gate; +30d on paid invitee; widget.js static/dynamic reconcile; `/api/brand` auto-provision; leaderboard paywall.

### How to verify

1. Jayson: `/billing` = Free vs Growth. Second brand → `/billing/plan/2`. Paid user: no upgrade nag.
2. Ronan: Hop `/t/<code>` → destination `?ref=<id>` → `POST /api/v1/network/conversions` with network key → referrer credited + reward. Widget `?ref=` signup also rewards. Zapier/API signup hits 500-cap. PayPal activate with confirm killed still grants Growth.

---

# VNOC paste (this repo only)

1. J1 — `/billing` Free vs Growth · Jayson · 3h · High  
2. J2 — Second-brand → `/billing/plan/2` · Jayson · 2h · High  
3. J3 — Hide paid upgrade nag; redirect orphan upgrade page · Jayson · 2h · Medium  
4. J4 — Billing mobile · Jayson · 1h · Medium  
5. **R1 — POST /api/v1/network/conversions** (network key, `ref` = `/t/` participant id) · Ronan · 5h · Critical  
6. R2 — `/t/` also set 30-day ref cookie · Ronan · 1.5h · High  
7. R3 — Widget signup fires reward for the referrer · Ronan · 2h · High  
8. R4 — Participant cap on API/Zapier/manual · Ronan · 2.5h · Critical  
9. R5 — Webhook calls `activatePaidSubscription` · Ronan · 2.5h · Critical  
10. R6 — `/stats` free = totals; kill 30-day copy if reward month not shipped · Ronan · 3h · High  

---

# Cursor prompt — affiliate-content worker + config-lander

**Do not edit `referrals.com/referrals-next`.** Ronan/Cursor own that. Wait until **R1** is deployed.

After `POST https://www.referrals.com/api/v1/network/conversions` is live:

```
Add a reusable conversion relay (once, not per domain).

On every HTML response / lander:
1. If inbound query has `ref` (integer) or `rref`, set a first-party cookie `ref` for 30 days (path=/, SameSite=Lax). Do not overwrite an existing newer ref.
2. On successful lead/signup (the same place you persist the email today), POST:

   POST https://www.referrals.com/api/v1/network/conversions
   Headers: x-api-key: <NETWORK_WRITE_KEY from Maida>, content-type: application/json
   Body: { "email", "name", "ref": "<cookie or query>", "domain": "<this hostname>" }

3. Fire-and-forget: never block or fail the user’s signup if referrals.com is down. Log status. Idempotent — posting twice is OK.
4. Do not call POST /api/v1/signups/referral (member API key + base64 code). That contract does not match /t/.
5. Backfill ipartner + inspectionservices if they are not on this worker/template.
6. Do not invent campaigns. If conversions 4xx “unknown ref”, skip.

Verify: click a /t/ link to a worker domain → cookie/query present → submit the lead form → referrals.com participant has invited_by set.
```
