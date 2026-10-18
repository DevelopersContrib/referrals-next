# Sprint — Oct 19–23, 2026

**Project:** Referrals.com (referrals-next)
**Window:** Monday Oct 19 – Friday Oct 23, 2026 (5 days)
**Created:** Oct 18, 2026 (Maida)
**Updated:** Oct 18, 2026 (board trimmed after Oct 18 billing work)
**Theme:** Collect the money that's already sitting there. Refresh the forum. New home, new topic page, a working phone layout, clean data, no spam.

**Sprint status:** **DRAFT**. More tasks are still being added. Do not start until Maida shares the final board.

Prior board: [`docs/sprint-sept-14-18.md`](sprint-sept-14-18.md).

One board, two parts: **Billing** (stop losing money) and **Forum redesign**. **Ronan = senior developer, billing.** **Joseph Javier = developer, forum.** **Andre = UI only** (layout, components, styling) for both.

Do **not** edit `.env` files in the repo. Only **Ronan** changes billing or PayPal code (`/billing/*`, `paypal-checkout.tsx`, `src/lib/billing-*`, `src/app/api/billing/*`); Andre touches billing screens only with Ronan. Shared MySQL: additive SQL only (new columns and tables; no drops or renames). Reuse the existing shadcn components.

| Who               | Focus                                                                  | Hours |
| ----------------- | ---------------------------------------------------------------------- | ----- |
| **Ronan**         | Senior developer: ship billing, live $9 (B4), orphan list (B2), win-back B16, emails B8, subscriber report B18, MRR B10 | 19.0  |
| **Joseph Javier** | Developer: forum JJ1–JJ8 (JJ2 spam/seed already done)                  | 24.0  |
| **Andre**         | UI only: publish modal B6 + forum A1–A6                                | 27.0  |

**Order (Ronan):** Mon — deploy the Oct 18 billing code, then B4 (Maida pays $9) + B2 orphan list + B18 report in the same pass. Wed — win-back B16. Fri — unpaid emails B8. B10 MRR if time is left.

**Order (Andre):** forum UI first; B6 (pay modal after campaign create) when that screen is next.

**PayPal (Maida, Oct 18):** production and Vercel stay **live**. Sandbox is localhost only — Ronan flips `PAYPAL_MODE` and the PayPal keys in his **local** env, never in the repo and never on Vercel.

---

# Already done Oct 18 — removed from this board

Do not rebuild these. They are in the working tree and still need a production deploy (B4).

- **B1** Second brand + Agency 10/50 + Unlimited brand coverage; failed-analysis drafts don't eat the unpaid slot
- **B2** Checkout requires a brand; payment publishes that brand (orphan CSV still open, see remaining B2)
- **B3** A completed PayPal payment marks the member verified
- **B4 code** Stored PayPal plan ids are reused only when ACTIVE; in-page button failure goes to redirect checkout
- **B5** `/billing` lists each brand Live/Private with Publish or Cancel; Go Live CTA only on that brand's homepage (hidden for platform admins and active Unlimited)
- **B7** Brand owner can test-signup on an unpaid widget / `/p/` page; visitors still can't
- **B9** `/pricing` and `/billing` show Brand monthly $9, Brand yearly $99, Agency 10, Agency 50 (UI names; `plans.name` in MySQL not renamed)
- **B11–B14** No duplicate first-month sale; renewals use the plan's `days`; `update-payments` updates the subscription's own rows; reactivate/suspend call PayPal first
- **B15** Not a Vercel change. Production stays live. Ronan uses sandbox only on localhost by changing his local PayPal env.
- **Forum** Spam topics "LOAN OFFER APPLY NOW" and "TwinTrafficWorld" deleted; 8 2026 topics seeded and showing on `/forum` (`force-dynamic`)

---

# Billing — still open

**Model stays pay-to-publish: a brand is set up free and costs $9/mo to go live.**

Billing rules for this sprint:

- Production checkout is **live PayPal** (Maida pays $9 on www). Localhost may use sandbox if Ronan changes his local PayPal env. Nobody edits `.env` in the repo or on Vercel.
- Do not change the price or the plans table rows; hide, don't delete. Public names stay in code (`PLAN_PUBLIC_NAME`).
- Any change to a member's paid status must match what PayPal says.

## P0 — Prove it takes money in production

## B4 — Confirm checkout works in production (2h) — CRITICAL · Ronan + Maida

> **Code/tools done (VNOC-66165):** `scripts/billing-checkout-health.ts`
> summarizes checkout event error counts and PayPal webhook verification
> status over a `--since` window. Full checklist at
> `docs/b4-prod-checkout-checklist.md`. The Oct 18 billing code (B1–B5,
> B7, B9, B11–B15) is confirmed on main.
> **Remaining:** Deploy main to production. Ronan runs the health script.
> Maida makes the $9 purchase. Verify the brand went live per the
> checklist.

The reuse/fallback bugs are fixed in code. Production has not taken a known-good $9 yet, and the Oct 18 billing branch is not deployed.

**Done when:**

- The Oct 18 billing code is on production
- `billing_checkout_events` checked for `server_error` / `client_error` and `billing_paypal_webhook_events` for verified deliveries; findings reported to Maida **Monday**
- One real $9 purchase made end to end (Maida pays) and the brand went live

## B2 — Orphan payments from before the brand-id fix (1h) — CRITICAL · Ronan + Maida

> **Code/tools done (VNOC-66166):** `scripts/orphan-payments.ts` lists
> member_payment rows with no matching url_plan (member, email, amount, date,
> PayPal ids, brands with live/private status). Supports `--csv`.
> `scripts/attach-orphan-payment.ts` attaches a payment to a brand (dry-run
> by default).
> **Remaining:** Ronan runs orphan-payments on prod, sends CSV to Maida. Maida
> decides each row (attach to brand or refund). Ronan runs attach script with
> `--apply` only after Maida's approval.

Checkout now requires a brand. People who already paid with no `url_plan` may still have a private brand.

**Done when:**

- A list of existing `member_payment` rows with no matching `url_plan` is sent to Maida
- Each is then attached to the member's brand or refunded (Maida decides)

## Quick revenue — this week (right after B4)

$9/mo alone is slow: $1,000/mo needs about 111 paying brands. This task brings in money this week from people already in the system.

## B16 — Win back members who set up a brand but never paid (6h) — CRITICAL · Ronan + Maida

These are the warmest leads: they wanted the product and stopped at the paywall.

**Ronan:**

- Query: members with at least 1 unpaid, non-VNOC brand. Columns: name, email, brand domain, brand id, signup date, last login. Send the count and the CSV to Maida **before anything is emailed**
- **Offer (decided Oct 18, Maida): first month $1, then $9/mo.** Build it as a separate PayPal billing plan with a 1-month trial cycle at $1.00, then the regular $9/mo cycle. Add it as its own `plans` row (e.g. "Brand, monthly — $1 first month", `is_for_sale = 0` so it never shows on `/pricing`); it is reachable only from the win-back link. It publishes one specific brand, and renewals extend by 30 days
- Each member can use the $1 offer once (check `member_payment` / `url_plan` history before checkout)
- Each email links to checkout for **that member's brand** (`/billing/plan/<offer plan id>?brandId=<id>`), with UTM `utm_source=winback&utm_campaign=oct2026`
- Send from the existing transactional email setup, in batches of 200, after Maida approves the copy. Log every send

**Maida:** approves the list and the copy, signs as Maida B.

**Draft email (edit before sending):**

> **Subject:** [Brand] is ready, it just isn't live yet
>
> Hi [First name],
>
> You set up [brand] on Referrals.com, but it's still private, so nobody can join your referral program yet.
>
> This week only: publish [brand] for **$1 for your first month**, then $9/mo. Cancel anytime.
>
> [Publish [brand] →]
>
> Maida B.

**Done when:** the list and count went to Maida; the $1 checkout charges $1 and then $9 live; the first batch went out; payments from it show up as Live brands.

## P1 — Turning signups into paying customers

## B6 — A clear moment to pay after a campaign is created (3h) — HIGH · Andre

The Go Live CTA now lives on the brand homepage (and is hidden for admins / Unlimited). After a campaign is created, the user still lands on a private campaign with no pay moment.

**Done when:**

- After a campaign is created, a modal appears: "Your campaign is ready. Publish [brand] for $9/mo to start taking signups." **Publish** opens checkout with the `brandId`; **Not yet** closes it
- Every private campaign page shows a "Private — not taking signups" bar with a Publish button (owner only; visitors keep the existing "isn't live" message)

## B8 — Follow-up emails to users who haven't paid (5h) — HIGH · Ronan

**Problem:** the `plan-expiry` job only emails members who already have an expiry date. `checkout-abandonment` sends no emails. Engagement emails only go out when an admin triggers `/api/admin/engagement/tick` by hand. The billing email still says "Launch on Free" (`src/lib/engagement-email-templates.ts:192`).

**Done when:**

- [x] A scheduled job in `vercel.json` sends unpaid brand owners a series on day 0, 1, 3 and 7, plus one email after an abandoned checkout _(code done in PR)_
- [x] Every email links to checkout for that specific brand _(code done in PR)_
- [ ] The copy matches the $9/mo pay-to-publish model — **Maida approves the copy**
- [ ] `UNPAID_FOLLOWUP_EMAILS_ENABLED=true` set in Vercel env — **Lee enables after approval**

## B18 — Subscriber report + Unlimited renewals (3h) — HIGH · Ronan + Maida

> **Code/tools done (VNOC-66167):** `scripts/subscriber-report.ts` lists active
> subscribers per plan from `member_plan` + `url_plan` with optional `--paypal`
> status check and `--csv` output. Premium Unlimited subscribers are highlighted.
> Draft emails in `docs/drafts/b18-plan-rename-emails.md`.
> **Remaining:** Ronan runs the report on prod, sends CSV to Maida. Maida
> reviews the report, approves the email copy, and decides each Premium
> Unlimited renewal.

Same-price plans and Unlimited brand coverage are already in code. What is left is the list and the emails.

**Ronan:**

1. **Report first (Mon, with B4):** active subscribers per plan from `member_plan` + `url_plan`, checked against PayPal status (ACTIVE / CANCELLED / SUSPENDED). Columns: member, email, plan, brands, PayPal subscription id, next billing date. Send to Maida. No changes before she reviews it
2. Same-price plans (Brand monthly, Brand yearly, Agency 10, Agency 50): no billing change
3. **Premium Unlimited ($1,999/yr):** stay grandfathered. Do **not** switch anyone's price. At renewal, Maida offers them Agency 50 instead
4. Draft one short email per group for Maida: "Your plan has a new name, nothing changes on your bill" (+ for agencies: "you can now publish up to N brands")

**Maida:** reviews the report, approves the emails, decides each Premium Unlimited customer at renewal.

**Done when:** the report went to Maida; every Premium Unlimited subscriber is listed with their renewal date.

## P2 — If time is left Friday

## B10 — MRR ignores per-brand subscriptions (2h) — ✅ DONE · Ronan

PR: `cursor/b10-mrr-fix-ed7e`

**Problem:** MRR only counts `members.plan_id`, so per-brand payments are missing. It can show $0 while people are paying.

**Where:** `src/lib/admin-subscriptions.ts:91`, `src/lib/revenue.ts:121`, `scripts/paid-funnel-snapshot.ts`.

**Done:**
- MRR is now the sum of active `url_plan` and `member_plan` subscriptions
- Yearly plans normalised to monthly (price / 12)
- Cancelled / suspended / expired subscriptions excluded
- Same PayPal agreement in both tables counted once
- VNOC / network brands stay at $0
- Shared helper: `src/lib/mrr.ts` (`computeActiveMrr` / `computeMrrFromRows`)
- Smoke test: `scripts/smoke-mrr.ts`

**Still open (needs prod access — Lee):** Verify computed MRR matches PayPal active subscriptions total. Requires PayPal API read against the live account.

---

# Forum redesign — mockups (build to these)

**Design:** [Referrals Forum Redesign](https://claude.ai/artifact/9D6QHXJia9Y6CG1yfQCQtR)

| Screen                     | What it shows                                                                                         | Tasks          |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| **Forum home · desktop**   | Header band with search + New topic, pinned row, topic list with tabs, category select, Archive link, sidebar | A1, A2, JJ3    |
| **Topic page · desktop**   | Breadcrumb, Answered / Pinned chips, post with upvote, Accepted answer, reply box, sidebar            | A3, A5, JJ8    |
| **Forum home · phone**     | Swipeable category chips, 3 tabs, stacked topic rows, sidebar cards below the list                    | A4             |

The handoff notes under the screens (data, categories, behaviour, SEO + style) are part of the spec.

**Style:** Dosis headings, Open Sans body (both already loaded in `src/app/layout.tsx`). Filled buttons use `#D63A40` so white text passes contrast; brand coral `#FF5C62` stays for accents only. Team badge purple `#7C3AED`.

---

# Why the forum still looks unfinished

Spam is gone and the 8 2026 topics are on `/forum`. Still missing:

- `src/app/(public)/forum/page.tsx` sorts by `date_posted`, so the newest **post** wins, not the newest **activity**. Old 2019–2021 threads still sit in the main list.
- No pinned topics, no search, no Team badge, no answered state, no Archive category, no first-post moderation.

---

# Joseph Javier — Developer (data, moderation, search, SEO)

## JJ1 — Additive schema for the forum (3h) — CRITICAL · Mon

Additive SQL on shared MySQL + `prisma/schema.prisma`. Lands Monday so Andre can wire the UI to real fields from Tuesday.

| Table              | New field / table                         | Type                                   | Used for                                   |
| ------------------ | ----------------------------------------- | -------------------------------------- | ------------------------------------------ |
| `topics`           | `is_pinned`                               | tinyint, default 0                     | Pinned row                                 |
| `topics`           | `status`                                  | varchar: `open` / `answered` / `hidden` / `pending` | Answered chip, moderation queue  |
| `topics`           | `last_activity_at`                        | timestamp                              | List order, Activity column                |
| `topics`           | `accepted_comment_id`                     | int, nullable                          | Accepted answer block                      |
| `topics`           | `view_count`                              | int, default 0                         | Top tab tiebreak                           |
| `topic_categories` | `description`, `sort_order`, `is_archived` | varchar, int, tinyint                  | Sidebar categories, Archive                |
| `members`          | `is_team`                                 | tinyint, default 0                     | Team badge                                 |
| `members`          | `forum_digest`                            | tinyint, default 0                     | Weekly digest opt-in                       |
| new                | `topic_followers` (`topic_id`, `member_id`, `created_at`) | table                  | Following tab, reply emails                |

**Done when:** columns and table exist in prod; `last_activity_at` backfilled from the latest comment, else `date_posted`; `is_team = 1` for Maida.

## JJ2 — Categories + Archive (1h) — CRITICAL · Mon

Spam delete and the 8-topic seed are done. Still to do:

- Categories, in this order: **Announcements** (Team only can post), **Getting started**, **Campaigns & rewards**, **Widgets & API**, **Feature requests**, **Show your campaign**, **Archive** (read-only, `is_archived = 1`)
- Move every 2019–2021 thread to **Archive**
- Map the seeded 2026 topics onto the list above. Pin "How publishing a brand works" and "Widget signups wait until the brand is published"

**Done when:** old threads only show under Archive; pinned topics sit on top.

## JJ3 — Topic list query (4h) — HIGH · Tue

- Order: pinned first, then `last_activity_at` newest first
- Tabs: **Latest activity**, **Top** (votes, then views), **Unanswered** (0 replies), **Following** (signed-in members)
- Category filter; 20 per page
- A new reply updates `last_activity_at`
- Hide `status = hidden | pending` from the public list

**Done when:** each tab and filter returns the right topics; a new reply moves its topic to the top.

## JJ4 — Search (3h) — HIGH · Wed

- Search topic title + body (and replies if cheap)
- Results page uses the same row layout as the list

**Done when:** searching "widget signups" finds that topic.

## JJ5 — Moderation + spam protection (5h) — HIGH · Wed–Thu

- A new account's first post is `status = pending` and waits for approval in `/admin/forum`
- Max 2 links per post; 5 posts per hour per member
- **Report** button on posts and replies → admin queue in `/admin/forum`

**Done when:** a test spam post from a new account never appears publicly until approved.

## JJ6 — Reply emails + weekly digest (4h) — MEDIUM · Thu

- Reply notification to the topic author and followers (not to the replier)
- Weekly digest for members with `forum_digest = 1`: new topics + answers from the past 7 days
- Digest job added to `vercel.json` crons

**Done when:** a test reply sends exactly one email per recipient; the digest job runs once and sends.

## JJ7 — SEO for topic pages (3h) — MEDIUM · Fri

- Every topic page: own `<title>`, meta description (first 155 chars of the post), canonical
- `QAPage` JSON-LD (accepted answer when there is one)
- All live topics in `sitemap.xml`; Archive topics `noindex`

**Done when:** JSON-LD validates in Google's Rich Results test; the sitemap lists every live topic.

## JJ8 — Accepted answer + follow endpoints (1h) — HIGH · Thu

- `POST` mark a reply as accepted (topic author or Team only) → sets `accepted_comment_id` + `status = answered`
- `POST` / `DELETE` follow a topic → `topic_followers`

**Done when:** Andre's A5 button and the Follow button work against these endpoints.

---

# Andre — UI

## A1 — Forum home layout (6h) — CRITICAL · Mon–Tue

Screen: **Forum home · desktop**. File: `src/app/(public)/forum/page.tsx` (+ shared parts in `src/components/forum/`).

- White header band: breadcrumb, H1 "Referrals.com Community", subline, **New topic** button, search box + Search button
- **Pinned by the team** row: 2 cards side by side (stack on phones)
- Topic list in one card: tabs (Latest activity / Top / Unanswered / Following) + Category select, then rows
- Row: avatar initials, title, one-line preview, category chip, Needs an answer chip, author + Team badge, date; **Replies** and **Activity** columns on the right
- Footer row: "Older threads from 2019–2021 have moved to the Archive" → Browse archive
- Monday: build with the mockup's content. Tuesday: switch to Joseph's JJ1/JJ3 fields

**Done when:** matches the mockup at 1440px and 1024px.

## A2 — Sidebar (3h) — HIGH · Tue

- **New here?** dark card: 3 links + Ask a question
- **Categories**: colored square, name, one-line description (from `topic_categories.description`)
- **Show your campaign** card → new topic in that category
- **Weekly digest** checkbox → `members.forum_digest`

**Done when:** the sidebar stacks under the list below 900px.

## A3 — Topic page (6h) — CRITICAL · Wed

Screen: **Topic page · desktop**. Files: `src/app/(public)/forum/post/*`, `src/app/(dashboard)/forum/post/[slug]`.

- Breadcrumb (Forum / category / title), Answered + Pinned chips, H1, meta line, Follow + Share buttons
- Post card: upvote + count, author with Team badge, date, body, Reply / Report
- **Accepted answer** block (green border + label) above the other replies
- Reply box with label, helper text ("A new member's first post is reviewed before it appears"), Post reply
- Sidebar: About this topic, Related topics (same category), **Ready to go live?** card → `/billing` (link only; do not touch billing code)

**Done when:** matches the mockup; a reply posts and shows without a page reload.

## A4 — Phone layout (4h) — HIGH · Thu

Screen: **Forum home · phone**.

- Header with menu button; search + full-width New topic
- Category chips in a row you swipe across
- 3 tabs (Latest / Top / Unanswered)
- Stacked rows: title, chips, replies + activity
- Sidebar cards move below the list

**Done when:** no sideways page scrolling at 390px; every tap target is at least 44px.

## A5 — Badges + accepted answer UI (2h) — HIGH · Thu

- **TEAM** badge when `members.is_team = 1`
- **Needs an answer** chip: a question with 0 replies after 24h
- **Mark as accepted answer** button on a reply, shown to the topic author or Team; calls Joseph's endpoint (JJ8)

**Done when:** marking an answer shows the Accepted answer block and the Answered chip on the list.

## A6 — Polish + QA with Joseph (3h) — MEDIUM · Fri

- Contrast 4.5:1 on all text; keyboard can reach every control; focus rings visible
- Empty states: no topics in a category, no search results, nothing followed
- End-to-end smoke: sign up → post → approve in admin → reply → email → accept answer

**Done when:** every acceptance item below is ticked.

---

# Acceptance (Fri Oct 23)

**Billing (Ronan)**

- [ ] Oct 18 billing code is on production
- [ ] One real $9 purchase went through end to end and the brand went live
- [ ] Orphan payments listed for Maida
- [ ] Unpaid owners get the publish modal, the private-page Publish bar, and the email series
- [ ] Win-back $1 offer emailed after Maida approves the list
- [ ] Subscriber report per plan sent to Maida

**Forum (Joseph + Andre)**

- [ ] `/forum` shows no 2019–2021 threads outside Archive
- [ ] Pinned topics on top, then topics by latest activity
- [ ] Search finds topics by title and body
- [ ] Topic page shows the Accepted answer block and Team badge
- [ ] A new account's first post waits for approval
- [ ] Reply email and weekly digest both send in a test
- [ ] Phone layout has no sideways scrolling at 390px
- [ ] Each topic page has its own title, description, canonical and valid JSON-LD; sitemap lists all live topics

---

# More tasks (to add)

_Maida is still adding tasks to this sprint._

---

# Out of scope

- Done-for-you setup service (parked by Maida, Oct 18; revisit later)
- Changing the price or the pay-to-publish model
- Renaming `plans.name` in MySQL (PayPal plan names are built from it)
- Switching Vercel / production PayPal to sandbox (localhost sandbox only, via Ronan's local env)
- Forum on the dashboard side beyond the shared topic page (`src/app/(dashboard)/forum/*` keeps working as is)

# Open questions

- Who else gets the Team badge besides Maida?
- Which day should the weekly digest go out?
- Orphan payments from B2: attach to a brand or refund?
