# Sprint — Aug 18–21, 2026

**Project:** Referrals.com (referrals-next)
**Window:** Tuesday Aug 18 – Friday Aug 21, 2026 (4 days)
**Created:** Aug 15, 2026

One board for everyone. Older per-person lists are retired — do not redo June work.

| Who        | Focus                                                         | Hours |
| ---------- | ------------------------------------------------------------- | ----- |
| **Jayson** | Dashboard overflow, slug checker, embed, upgrade CTA          | 15.0  |
| **Kareen** | `/stats` + `/billing` plan cards (UI/copy only)               | 11.0  |
| **Ronan**  | **Onboarding must not take 10 min**, Shopify, paid→engagement | 12.0  |

**Rules for all:** do not edit `.env`. Shared MySQL: additive SQL only. Public widgets must never 403 visitors when the owner is `free_capped`. Do not add a unique index on `member_urls.slug`.

---

# Jayson — Web UI

## J1 — Dashboard shell: no horizontal scroll (4h) — CRITICAL

Sidebar + main must stay inside the viewport. Reproduced Aug 15 on campaign overview.

**Cause:** `SidebarProvider` is `w-full` with a `16rem` spacer; `SidebarInset` is also `w-full` with no `min-w-0` → 16rem + 100% overflow.

- [ ] `SidebarProvider`: `min-w-0 max-w-full overflow-x-hidden`
- [ ] `SidebarInset`: remaining width only (`min-w-0 flex-1`), not `w-full`
- [ ] `DashboardClientRoot` `<main>`: `min-w-0 max-w-full`; tables scroll **inside** the card
- [ ] Collapsed / mobile sheet still work

**Files:** `src/components/ui/sidebar.tsx`, `src/app/(dashboard)/dashboard-client-root.tsx`

**Done when:** 375 / 768 / 1024 / 1280 — no document scrollbar on `/dashboard`, `/brands`, campaign, Integrations, `/stats`, `/billing`.

## J2 — Campaign + Integrations fit the column (2.5h) — HIGH

- [x] Header actions wrap below `md`
- [x] `CampaignTabs` scroll/wrap inside the tab bar only
- [x] `IntegrationGuide` `<pre>`: `max-w-full overflow-x-auto`; right panel `min-w-0`
- [x] `#integrations/iframe` still opens Embed

**Files:** campaign `[campaignId]/page.tsx`, `campaign-tabs.tsx`, `integration-guide.tsx`, share-links / embed panels

## J3 — Full user-dashboard responsive pass (3.5h) — HIGH

Same shell rules on member routes (not admin, not marketing). Walk `/dashboard`, `/contacts`, `/brands`, create/edit/widget, `/billing`, `/account`, `/forum`, `/tools/*` at 375 / 768 / 1280. **`/stats` visuals are Kareen’s** — only fix overflow if the shell still breaks. `min-w-0` on flex children; tables in `overflow-x-auto`; URLs `truncate` + copy.

## J4 — Slug checker before create (2h) — HIGH

Two brands shared `blacksesameph`; public page 404’d. Edit already calls `/api/brands/check-slug`. Create / onboarding / admin new do not.

- [ ] Live available/taken + next unique suggestion **before** Analyze / create
- [ ] Server refuses collisions (`uniqueBrandSlug` or 409)
- [ ] No unique index on `slug` this sprint

**Files:** `brand-analyzer.tsx`, `brand-form.tsx`, admin new brand, `POST /api/brands`, analyze + launch

## J5 — Full-page campaign embed snippet (1.5h) — MEDIUM

Integrations only ship the widget. Add a **Full page** iframe for `/p/{slug}/campaign/{id}` in `buildCampaignEmbedSnippets`. Widget snippets stay. Confirm the public page is iframe-friendly (do not weaken dashboard CSP).

Smoke: campaign 21562 / brand `blacksesameph-com`.

## J6 — Replace the free-forever amber strip with a real upgrade CTA (1.5h) — HIGH

**Goal:** The dashboard banner for `free_capped` is a thin yellow alert + text link. It looks like a warning, not an offer. Replace it with a conversion card.

**File:** `src/components/dashboard/paid-onboarding-banner.tsx` (the `status === "free_capped"` branch). It already renders in `dashboard-client-root.tsx` on every member page — one fix, everywhere.

Do **not** change checkout. Link still goes to `/billing/plan/2`.

### Suggested layout

Left: short copy. Right: solid button. Mobile: stack, button full-width.

- Eyebrow: “Free forever”
- Headline: **Keep your widget. Unlock Growth.**
- Body: Your campaign stays live. Growth removes Referrals.com branding and unlocks more brands, leaderboards, and full stats.
- Three chips: Remove branding · More brands · Advanced stats
- Button: **Upgrade to Growth — $9/mo** (not a pink text link)

Match dashboard: white card, `#FF5C62` / `#926efb` gradient accent bar on the left or top, Dosis headline, 44px button. Not amber/warning. Not “capped” in the headline (sounds like a penalty).

Same pass on the last-3-days **trial** strip in the same file if it is still a one-line violet alert — make it a compact “X days left · Keep Growth” card with a button.

### Done when

A `free_capped` member sees a designed upgrade card on `/dashboard` (and other dashboard routes), not a yellow warning. Click still opens existing checkout.

---

# Kareen — Stats + billing page copy

**Do not touch PayPal, checkout APIs, webhooks, or `/billing/plan/[planId]`.** Checkout is done. `/billing` listing copy/UI is yours.

June security/billing work is done. Do not redo it.

## K1 — Make `/stats` awesome (8h) — HIGH

**Goal:** `/stats` should feel like a command center, not six gray cards and one participants line.

### Current state

`src/app/(dashboard)/stats/page.tsx` already has real totals (participants, shares, clicks, impressions, rewards, campaigns), a Growth-gated `StatsPerformanceSection` (participants-only chart + client-side 7/30/90 filter — TODO still says “wire to server”), and a per-campaign table (name, participants, shares, clicks, id). The dashboard-wide amber upgrade strip is **Jayson J6** — do not restyle it here.

It works. It does not look or feel like a product we charge $9/mo for.

### What “awesome” means

- [ ] **Hero row:** the six KPIs stay, but each card gets a sparkline or 7-day delta, an icon, and the brand red/violet/emerald language already used on campaign cards. Not six identical white boxes.
- [ ] **Funnel:** impressions → clicks → signups → rewards, with conversion % between steps. Data is already on the page (`totalImpressions`, `totalClicks`, `totalParticipants`, `totalRewards`).
- [ ] **Chart:** more than participants. Overlay or toggle shares / clicks / impressions over time. Wire the 7d / 30d / 90d / all filter to the **server** (`getMemberParticipantsSeries` and siblings in `src/lib/member-stats.ts`) — drop the client-only TODO.
- [ ] **Campaign table:** add impressions + a simple conversion (clicks/impressions or signups/clicks). Sort by a useful default (clicks or participants). Keep the mobile list.
- [ ] **Empty / new-account state:** if they have a brand but no traffic yet, show what to do next (embed / public page) — not a blank chart. Do not invent fake numbers.
- [ ] **Entitlement stays:** `free_capped` keeps basic totals only. Trial + paid get the full charts. Upgrade CTA can stay; make it one tight line, not a sad empty card.
- [ ] Match dashboard look (Dosis headings, `#FF5C62`, `#ebeef0` borders). Mobile: cards stack, chart `ResponsiveContainer`, table scrolls inside the card.
- [ ] Do **not** edit `.env` or checkout files. Billing listing copy is **K2**.

### Files

- `src/app/(dashboard)/stats/page.tsx`
- `src/components/dashboard/stats-performance-section.tsx`
- `src/components/dashboard/stats-chart.tsx`
- `src/components/dashboard/stats-date-filter.tsx`
- `src/components/dashboard/stats-campaign-mobile-list.tsx`
- `src/lib/member-stats.ts` (extra series / deltas)

### Done when

A Growth/trial member opens `/stats` and can answer, in one screen: are we growing, where is the funnel leaking, which campaign is winning. A free_capped member still sees totals + upgrade, no chart APIs leaking. Jayson’s shell still does not horizontally scroll.

## K2 — `/billing` Available Plans look like a product (3h) — HIGH

**Goal:** `/billing` should match `/pricing`. Today it dumps the `plans` table: ugly names (`PREMIUM BY BRAND`), `$9.00/month`, “Up to N brands”, “0 participants/campaign”, “30 days”, and a CTA that says **Pay with card or PayPal**.

Do **not** change checkout. Only `src/app/(dashboard)/billing/page.tsx` (and small presentational pieces if you extract a card). Hide PayPal agreement IDs from members.

### Suggested copy (use this)

**Page title:** Plans  
**Subtitle:** 14 days of Growth, then free forever — or keep Growth for $9/month per brand.

**Current plan** — human status, not DB:

- Trial: “You’re on Growth (trial) · X days left”
- Free capped: “Free forever · 1 brand, 500 participants, branding on”
- Paid: “Growth · renews [date]”
- Cancelled but not expired: “Growth cancelled · access until [date]”
- Do **not** badge a healthy free account as **Expired**.

**Two cards only** (map plan id 1 + 2; ignore leftover admin plans):

|          | Free forever                                                                             | Growth (featured)                                                                                           |
| -------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Eyebrow  | After your 14-day trial                                                                  | Most popular                                                                                                |
| Price    | **$0** / forever                                                                         | **$9** / month per brand                                                                                    |
| Blurb    | Widget stays live. Caps apply. Branding on.                                              | Remove branding. Unlock domains & analytics.                                                                |
| Features | Widget keeps working · 1 brand · 500 participants · Basic stats · Referrals.com branding | Everything in Free, plus: remove branding · more brands · higher limits · public pages · advanced analytics |
| CTA      | “Included after trial” (no button) or “You’re on Free”                                   | Trial/free → **Continue with Growth** → `/billing/plan/2`. Paid on 2 → **Current plan**                     |

Do not say “Pay with card or PayPal” on this page. Do not show “30 days” as a feature. Do not print `0` participants as “unlimited” unless you mean it — free is **500**, Growth is uncapped for product copy.

Match `/pricing` look: Free = rose card, Growth = violet featured ring + “Most popular”. Dosis headings, `#FF5C62` / `#926efb`. Two columns on `md+`, stack on mobile.

### Done when

A free or trial member opens `/billing` and sees Free vs Growth the same way they saw `/pricing` — not a raw plan grid. Clicking Growth still goes to the existing checkout page unchanged.

---

# Ronan — Pipeline, integrations, growth

June pipeline work is done (entry/reward emails, Mailchimp/Zapier, OAuth, webhook verify, agent auth). Do not redo those.

**Sprint status (Ronan):** R1 ✅ · R2 ✅ · R3 ✅ · R4 partial (code ✅, live email smoke pending) · R5 ✅ (code; live OG preview optional)

## R1 — Domain onboarding must not take 10 minutes (4.5h) — CRITICAL ✅

**Goal:** Adding a domain is a first-run moment. **10 minutes is a bug.** Member sees brand name / logo / scores in **~15 seconds**. Hard fail: if they are still staring at “Generating referral campaigns…” at **30 seconds**, this ticket is not done.

### Why it can hit 10 minutes today

Onboarding (`BrandAnalyzer`) polls until the **whole job** is `done`. That waits on all five modules:

`vnoc` + `crawl` → `social` + `intelligence` → **`campaigns` (OpenAI, 3 full programs)**

- Crawl: homepage (12s timeout) + `/contact` + `/pricing` (8s). A hung site burns the budget before intelligence starts.
- Campaigns is a second OpenAI call. The AI builder already regenerates from the brief — the default three on first analyze are wasted time **and** they block the UI.
- Module fan-out is an extra HTTP hop (`/run/[module]`). If the trigger fails, the sweeper waits **2 minutes**, up to **3 attempts** → 6+ minutes of dead air. Cron may not even tick that often.
- UI does not flip to results until campaigns finish (`brand-analyzer.tsx` waits for `status === "done"`).

### Tasks

- [x] **Unblock the UI:** show `BrandResults` when `intelligence` is done (logo, scores, profile). Do not wait for the `campaigns` module. (`brand-analyzer.tsx`)
- [x] **Skip default campaign gen on first analyze** (or run it only if the member stays on the results page). Dedicated `/campaigns/ai` already generates from the brief. (`ONBOARDING_MODULES` excludes `campaigns`)
- [x] **Cap the crawl:** homepage + at most one extra page; timeout **5s**; fail soft and continue. Intelligence can run on homepage-only data. (`crawler.ts`)
- [x] **Don’t stall on a dead trigger:** if `/run/[module]` doesn’t 202, run the module in-process on the analyze POST (or shorten sweeper from 2 min to 20s for `queued`). In-process fallback in `orchestrator.ts` `triggerModule`. Sweeper still 2 min for stuck `running` — acceptable; cron every 5 min.
- [x] Time the job: log `started_at` → each module `completed_at` → `done`. Target: intelligence ready **< 15s** on a normal site (e.g. `blacksesameph.com`). (`orchestrator.ts`)
- [x] Do not re-crawl the whole site when Design with AI reuses an existing brand (`createAnalysisJobForBrand`) if crawl+intel already exist. (`findReusableAnalysis` + `copyAnalysisArtifacts`)

**Files:** `src/lib/analysis/crawler.ts`, `orchestrator.ts`, `registry.ts`, `src/app/api/brands/analyze/route.ts`, `brand-analyzer.tsx`, `analysis-pipeline.tsx`

**Done when:** New onboarding of a live domain (e.g. `blacksesameph.com`) shows brand name/logo/scores in **~15s**, never 10 minutes. Campaign cards are optional/background. A hung `/pricing` page does not block the result. A dead module trigger does not leave them on a spinner.

## R2 — Shopify env + OAuth smoke (2h) — HIGH ✅

Code uses `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET`. Local `.env` still has `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET`. Align **code** to one pair (prefer Shopify’s `CLIENT_ID` names). Update `.env.local.example` only — do not edit `.env`. Document the two keys ops must set in Vercel. Smoke: connect a test shop or prove the authorize URL is well-formed.

- [x] Code aligned to `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` (legacy `SHOPIFY_API_*` fallback in `shopify.ts`)
- [x] `.env.local.example` — Shopify vars + `NEXT_PUBLIC_SHOPIFY_CLIENT_ID`
- [x] Vercel ops docs — `docs/shopify-integration.md`
- [x] OAuth smoke — `npx tsx scripts/smoke-shopify-oauth.ts` (well-formed authorize URL; no live shop required)

## R3 — Enroll engagement after paid activate (2.5h) — HIGH ✅

Paid checkout now writes `member_plan` + entitlements. Engagement still segments `trial` / `free_capped` / `paid` but activate does not enroll the “you just paid” sequence.

- [x] On successful `billing-activation` / webhook activate, enroll the member in the paid campaign (or stop the trial/loss-aversion sequence). (`handlePaidEngagementTransition` in `billing-activation.ts` via confirm/execute)
- [x] Idempotent — replayed webhooks must not double-enroll. (`alreadyProcessed` skip + existing enrollment check)
- [x] Do not send mail from the webhook if the engagement tick already would. (engagement runs in `activatePaidSubscription`, not PayPal webhook route)

**Files:** `src/lib/billing-activation.ts`, webhook route, `src/lib/engagement-segments.ts`

## R4 — Campaign email smoke (2h) — MEDIUM _(partial)_

`sendCampaignEntryEmail` / `sendCampaignRewardEmail` are wired. Prove they arrive.

- [ ] Join via widget → entry email with `{{name}}` / referral link _(live smoke not recorded)_
- [ ] Hit reward threshold → reward email with coupon/cash _(live smoke not recorded)_
- [x] Failed SES must not fail signup (already try/catch — confirm). (`widget/signup`, `widget/reward`)
- [x] From display = campaign/brand name, not a raw SES address if we can set it. (`fromName: brand?.domain || campaign.name`)

## R5 — Public campaign OG from hero (1h) — LOW ✅

Launched AI campaigns have `banner_image_url`. `buildPublicCampaignMetadata` should set `openGraph.images` (already started — confirm live `/p/{slug}/campaign/{id}` shows the hero in Slack/iMessage). Add those URLs to `sitemap.xml` if missing.

- [x] `openGraph.images` + Twitter card from `heroImageUrl` (`public-campaign-page.tsx`)
- [x] Public campaign URLs in `sitemap.xml` (`/p/{slug}/campaign/{id}`)
- [ ] Confirm live preview in Slack/iMessage _(optional manual check)_

---

# Hours

| ID                                  | Owner      | Hours    | Pri          |
| ----------------------------------- | ---------- | -------- | ------------ |
| J1 Shell overflow                   | Jayson     | 4.0      | Critical     |
| J2 Campaign / Integrations fit      | Jayson     | 2.5      | High         |
| J3 Dashboard responsive             | Jayson     | 3.5      | High         |
| J4 Slug checker                     | Jayson     | 2.0      | High         |
| J5 Full-page embed                  | Jayson     | 1.5      | Medium       |
| **J6 Free-forever upgrade CTA**     | **Jayson** | **1.5**  | **High**     |
| **K1 Make `/stats` awesome**        | **Kareen** | **8.0**  | **High**     |
| **K2 `/billing` plan cards**        | **Kareen** | **3.0**  | **High**     |
| **R1 Onboarding ≠ 10 minutes** ✅   | **Ronan**  | **4.5**  | **Critical** |
| R2 Shopify env ✅                   | Ronan      | 2.0      | High         |
| R3 Paid → engagement ✅             | Ronan      | 2.5      | High         |
| R4 Campaign email smoke _(partial)_ | Ronan      | 2.0      | Medium       |
| R5 Public OG / sitemap ✅           | Ronan      | 1.0      | Low          |
| **Total**                           |            | **38.0** |              |

### How to verify

1. Jayson: `document.documentElement.scrollWidth === clientWidth` at 375–1280; `free_capped` dashboard banner is a real upgrade card (not the amber strip).
2. Kareen: `/stats` funnel + multi-series chart; `/billing` Free vs Growth cards. No checkout/PayPal files.
3. Ronan: onboard a new domain — brand results on screen in ~15s, **never 10 minutes**; widget signup email arrives; pay → engagement enrollment row.
