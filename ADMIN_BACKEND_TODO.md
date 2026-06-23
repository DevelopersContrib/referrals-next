# Admin Backend — Status & TODO

Tracking the work to make `/admin` a complete, secured admin backend.
Everything below is **uncommitted** (working tree only) per the current hold.

_Last updated: 2026-06-23_

---

## ✅ Done & verified

### Security / access
- [x] **Admin is `.env`-only** — `ADMIN_EMAILS` is the single source of truth
  (`src/lib/platform-admin.ts`); VNOC `is_admin` lookup removed.
  - Current admins: `maidabarrientos@gmail.com, chad@ecorp.com, ecorpcom@gmail.com, admin@domaindirectory.com`
- [x] **Page gate** — `src/app/(admin)/layout.tsx` redirects non-admins to `/dashboard`
  (anonymous already bounced to `/signin` by `src/proxy.ts`).
- [x] **API gate** — all 27 `src/app/api/admin/**` route files (48 handlers) call
  `requirePlatformAdminApi()` (applied via `scripts/gate-admin-routes.mjs`).
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

### Remaining optimization opportunities (deferred — low risk to ship without)
- [ ] **Admin gate boilerplate** repeated in 48 handlers — could become a
  `withAdminApi()` wrapper. Currently consistent (codemod-generated); refactoring all
  48 right before submission is churn. Leave for a follow-up.
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

## 🟡 Needs verification (built, not yet smoke-tested)

The CRUD above was generated against the real Prisma models but only partially
verified. Before relying on it:

- [ ] `npx tsc --noEmit` → 0 errors (after the subdomains fix).
- [ ] `npx eslint` over `src/app/api/admin` + `src/app/(admin)` → clean.
- [ ] `pnpm build` (Vercel deploys on a clean build; no `ignoreDuringBuilds`).
- [ ] **Logged-in smoke test as an admin** for each entity: create → list shows it →
  edit → save → delete. Confirm required-field validation and that FK columns
  (e.g. `campaign_id`, `url_id`, `member_id`) are set correctly on create.
- [ ] Confirm every **new** API route includes the `requirePlatformAdminApi()` gate
  (the codemod only touched pre-existing files; agent-created `[id]` routes added
  it manually — verify).

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
- **Admins must re-login** so their session JWT reflects the new `ADMIN_EMAILS`.
- Everything is **uncommitted** — review the diff before committing.
- One-off tooling left in tree: `scripts/gate-admin-routes.mjs` (idempotent; documents the API gating).
