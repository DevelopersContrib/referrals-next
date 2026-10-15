# Admin Backend — Status & TODO

Tracking the work to make `/admin` a complete, secured admin backend.
The hold is over — everything described below is committed and on `main`.

_Last updated: 2026-10-13_

---

## ✅ Done & verified

### Security / access
- [x] **Admin flag lives in the DB** — `members.is_admin` is the source of truth.
  `sessionIsPlatformAdmin()` (`src/lib/require-platform-admin.ts`) trusts
  `session.user.isAdmin` when present and otherwise re-reads the column via
  `memberIdIsPlatformAdmin()`.
  - ⚠️ An earlier revision of this doc claimed `ADMIN_EMAILS` was the single source
    of truth. It is **not** an access-control input — `src/lib/platform-admin.ts`
    uses it only to keep team accounts out of dashboard stats and revenue
    (`getPlatformAdminMemberIds`, `getExcludedMemberIds`). Granting admin means
    setting `members.is_admin = 1`, not editing `.env`.
- [x] **Page gate** — `src/app/(admin)/layout.tsx` redirects non-admins to `/dashboard`
  (anonymous hits on `/admin*` are bounced to `/signin` by `src/proxy.ts`; unknown non-public
  paths get a real 404 via `src/app/not-found.tsx`, not sign-in).
- [x] **API gate** — all 57 `src/app/api/admin/**` route files (101 handlers) are gated.
  Three interchangeable helpers all funnel into `sessionIsPlatformAdmin()` and return
  401/403: `adminApiGuard()` and `requirePlatformAdminApi()`
  (`src/lib/require-platform-admin.ts`), plus `requireAdminApi()`
  (`src/lib/panel-admin-api.ts`), the shim used by the ported engagement routes.
  Originally applied via `scripts/gate-admin-routes.mjs`.
- [x] Verified: anonymous hits to `/admin*` and `/api/admin/*` → **307 → /signin**.

### Dashboard (real data)
- [x] `src/lib/admin-stats.ts` + `src/app/(admin)/admin/page.tsx` — ~20 live metrics,
  this-month deltas, 12-month member-growth chart, recent signups, top brands,
  top campaigns. Validated against the live DB.

### Billing
- [x] **Subscriptions** — `/admin/subscriptions` (`src/lib/admin-subscriptions.ts`,
  page, stats: Active/MRR/Pending/Cancelled/New) reading `member_plan`.
- [x] **Cancel subscription** (live PayPal) — `src/app/api/admin/subscriptions/[subscriptionId]/cancel/route.ts`
  + two-step confirm button. Reuses `cancelSubscription()` from `lib/paypal.ts`.
- [x] **Transactions** — Payments page relabeled, added member search + This-Month card.
- [x] Sidebar Billing group: Plans · Subscriptions · Transactions.

### CRUD completed (landed by the entity build-out; see "Needs verification")
| Entity | Collection | `[id]` route | New | Edit | Delete |
|---|---|---|---|---|---|
| members | GET, POST | GET/PUT/DELETE | ✅ | ✅ | ✅ |
| plans | GET, POST | GET/PUT/DELETE | ✅ | ✅ | ✅ |
| brands | GET, **POST** | GET/PUT/DELETE | ✅ | ✅ | ✅ |
| campaigns | GET, **POST** | GET/PUT/DELETE | ✅ | ✅ | ✅ |
| coupons | GET, **POST** | **GET/PUT/DELETE** | ✅ | ✅ | ✅ |
| contests | GET, **POST** | **GET/PUT/DELETE** | ✅ | ✅ | ✅ |
| deals | GET, POST, DELETE | **GET/PUT/DELETE** | ✅ | ✅ | ✅ |
| email-templates | GET | **GET/PUT/DELETE** | n/a* | ✅ | ✅ |
| participants | GET | **GET/PUT/DELETE** | n/a* | (edit) | ✅ |

\* No create flow by design — these rows are generated elsewhere (per-campaign /
user-submitted).

---

## ✅ Build blocker fixed
- [x] **`subdomains/page.tsx` `asChild` on `<Button>`** → replaced with the
  wrap-in-`<Link>` pattern. `pnpm build` now compiles (215 pages).

## ✅ Dedup & optimization pass (for submission)
- [x] **Delete buttons** — 5 near-identical per-entity components (participants,
  email-templates, deals, coupons, contests) → one generic
  `src/components/admin/admin-delete-button.tsx`. Old files removed.
- [x] **Pagination** — 5 duplicated Prev/Next blocks → one
  `src/components/admin/admin-pagination.tsx` (preserves arbitrary query params).
- [x] **Correctness** — `campaigns/[campaignId]` PUT now does a 404 existence check
  before update (matches the other entities).
- [x] **Dropdown limit** — admin "new campaign" brand selector `?limit=100` → `500`.
- [x] **Caught + fixed a regression**: the codemod that swapped in `AdminDeleteButton`
  dropped the `${id}` interpolation (every endpoint was `/api/admin/<x>/` with no id).
  Restored on all 5 pages; `pnpm build` green. (tsc/eslint passed it because the
  empty template literal is valid syntax — the build gate + a manual grep caught it.)

### Dedup pass 2 (done)
- [x] **Admin gate boilerplate** — the repeated 6-line gate + redundant `auth()` check
  across 34 route files → single `adminApiGuard()` helper in `require-platform-admin.ts`
  (~380 lines of boilerplate removed). `auth()` kept only where `session` is actually
  used (blog, impersonate). Every handler still gated (verified).
- [x] **Formatters** — duplicate `money`/`fmt` in admin dashboard + subscriptions →
  `src/lib/admin-format.ts` (`fmtNumber`, `fmtMoney`).
- [x] **Dead code** — removed the redundant `deals` collection `DELETE` (the UI uses the
  `[dealId]` route).

### Remaining optimization opportunities (deferred — pre-existing patterns, low risk)
- [ ] **Identical `?id=` collection DELETE handlers** (reviews/testimonials/api-keys/
  subdomains/forum) — pre-existing; could become an `adminDeleteByQueryId()` factory.
  (forum cascades, so it stays bespoke.)
- [ ] **"batch-load members into a Map"** pattern repeated across ~5 list pages — could
  be a `batchLoadMembers()` helper.
- [ ] **`take: 200` collection routes** (coupons/contests/deals/subdomains/email-templates)
  — accept `page`/`limit` instead of a hard cap.
- [ ] **`subdomains` list page** is client-side and loads all rows via the
  query-param `DELETE` (`?id=`); the new `[subdomainId]` route also has DELETE →
  redundant. Convert the page to server pagination + `AdminDeleteButton`, then drop
  the collection DELETE. (Same redundant collection DELETE exists on `deals`, now
  unused by the UI.)
- [ ] Apply `AdminPagination` to the pre-existing list pages (members, brands,
  campaigns, forum, payments) for full consistency.

---

## ✅ Verification (all gates green as of 2026-10-14)

The CRUD above was generated against the real Prisma models. It has now been
verified end-to-end:

- [x] `npx tsc --noEmit` → 0 errors. _(2026-10-13)_
- [x] `npx eslint` over `src/app/api/admin` + `src/app/(admin)` → clean. _(2026-10-13,
  after `d3a3179` cleared 8 `react-hooks/set-state-in-effect` errors in the list pages)_
- [x] Production build compiles. _(2026-10-13)_ — use `npx next build`; `pnpm build`
  runs `prisma generate` first, which fails with `EPERM … query_engine-windows.dll.node`
  while a dev server is holding the DLL.
- [x] Confirm every **new** API route includes an admin gate — re-audited per HTTP
  method (so a guard on `GET` can't mask an unprotected `DELETE`) across all 57 route
  files / 101 handlers: **0 ungated**. _(2026-10-13)_
- [x] **Logged-in smoke test as an admin** — run 2026-10-14 against the local dev DB,
  signed in as a real admin session. **105/105 checks passed.**
  - create → list → edit → verify → delete → confirm-gone for all 7 create-capable
    entities (plans, members, brands, campaigns, coupons, contests, deals), plus
    edit/delete for the two generated ones (participants, email-templates).
  - Required-field validation returns 400 with a useful message on every collection
    POST; duplicate member email returns 409; a campaign pointing at a non-existent
    brand returns 404; deleting a plan that still has subscribers returns 409.
  - FK columns verified on the created rows: `member_urls.member_id`,
    `member_campaigns.url_id`, `campaign_coupons.campaign_id`,
    `campaign_contest.campaign_id` + `member_id`, `brand_deals.url_id` + `member_id`.
    Note `member_campaigns.member_id` is correctly derived from the brand rather than
    taken from the request body.
  - All 32 `/admin` pages render 200 with no runtime error.
  - Row counts returned to baseline afterwards — the run leaves nothing behind.
  - To re-run it yourself, grant admin with
    `UPDATE members SET is_admin = 1 WHERE email = '<your dev account>';` and sign in
    again (the flag is read into the session JWT at sign-in).

---

## ⬜ Remaining gaps (decide scope)

Moderation-style entities are functionally complete for their purpose but are not
full CRUD:

- [ ] **reviews / testimonials** — approve/reject/delete only (no create; user-submitted). Probably fine as-is.
- [ ] **api-keys** — list + revoke only (keys are member-generated). Fine as-is unless admin-issued keys are wanted.
- [ ] **forum** — list + delete topics. Add edit / category management? (`/admin/forum/categories` exists.)
- [ ] **integrations** — list only (Mailchimp connections). Add per-row disconnect (DELETE)?
- [ ] **blog** — file-based (`getAllPosts()`), not DB. Generate + delete exist; no edit UI.
- [ ] **settings** — file-based (`data/admin-settings.json`). Works; not DB-backed.
- [ ] **emails (logs)** — STUB ("Coming Soon"); needs real SES log source.
- [ ] **cron** — STUB; hardcoded job list, trigger routes mostly don't exist.

---

## 📌 Notes / risks
- **Cancel subscription hits LIVE PayPal** when `PAYPAL_MODE=live` (sandbox otherwise).
  Guarded by a two-step confirm; failures return 502 and do **not** mark cancelled locally.
- **Admins must re-login** after `members.is_admin` changes, so the session JWT picks
  up the new flag.
- **Don't run `next build` and `next dev` against the same `.next/`.** After a
  production build, the next `next dev` served an HTML 404 for *every* dynamic route
  (`/api/admin/plans/[planId]`, `/api/brands/[id]/stats`, `/p/[slug]` …) while static
  routes kept working — which looks exactly like the `[id]` handlers being broken.
  `rm -rf .next` and restart dev to clear it.
- One-off tooling left in tree: `scripts/gate-admin-routes.mjs` (idempotent; documents the API gating).
