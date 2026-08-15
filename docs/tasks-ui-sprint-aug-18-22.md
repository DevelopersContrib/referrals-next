# UI Sprint — Aug 18–22, 2026

**Project:** Referrals.com (referrals-next)
**Role:** Web UI (Jayson)
**Sprint window:** Tuesday Aug 18 – Saturday Aug 22, 2026
**Created:** Aug 15, 2026

Supersedes **J7 — Mobile Responsiveness Audit** in `docs/tasks-jayson.md` (1 hour / Low). That ticket was too small — the dashboard currently **forces horizontal scroll** because the shell is wider than the viewport.

---

## U1 — Dashboard shell: no horizontal scroll (4 hours) — CRITICAL

**Goal:** Sidebar + main content stay inside the viewport. Members never have to scroll right to use the user dashboard.

### Problem (reproduced Aug 15)

On `/brands/[brandId]/campaigns/[campaignId]` (and likely every dashboard page), the layout is wider than the window. You must scroll right to see the full sidebar + main column.

**Root cause (shell, not one page):**

1. `SidebarProvider` (`src/components/ui/sidebar.tsx`) is `flex min-h-svh w-full` with **no** `min-w-0` / `overflow-x-hidden`.
2. Desktop sidebar reserves **`16rem`** (`SIDEBAR_WIDTH`) via a spacer.
3. `SidebarInset` is `w-full flex-1` **without** `min-w-0`. In a flex row, `w-full` = 100% of the parent. **16rem + 100% = overflow.**
4. `DashboardClientRoot` main (`src/app/(dashboard)/dashboard-client-root.tsx`) is `overflow-auto` but the **wrapper** still grows with wide children (code blocks, tables, nowrap tabs, long URLs).

Classic flex bug: a flex child defaults to `min-width: auto`, so it will not shrink below its content.

### Fix the shell first (do this before page-by-page work)

- [ ] `SidebarProvider` wrapper: add `min-w-0 max-w-full overflow-x-hidden` (keep `w-full`).
- [ ] `SidebarInset`: replace `w-full` with `min-w-0 flex-1` (or `w-full min-w-0 max-w-full`). It must take **remaining** width, not 100% + sidebar.
- [ ] `DashboardClientRoot` `<main>`: `min-w-0 max-w-full overflow-x-auto` (page-level tables may still scroll **inside** the card, not the whole app).
- [ ] Confirm collapsed / icon sidebar and mobile sheet still work (`useIsMobile`, `SidebarTrigger` in the header).
- [ ] Do **not** edit `.env` or working billing/auth files.

### Files to modify (shell)

- `src/components/ui/sidebar.tsx` — `SidebarProvider`, `SidebarInset`
- `src/app/(dashboard)/dashboard-client-root.tsx` — `<main>` / inset

### Acceptance

- At **1280px**, **1024px**, **768px**, and **375px**: no document-level horizontal scrollbar on `/dashboard`, `/brands`, campaign overview, Integrations tab, `/stats`, `/contacts`, `/billing`.
- Sidebar is fully visible without panning right.
- Wide tables / embed snippets scroll **inside** their card, not the whole page.

---

## U2 — Campaign + Integrations pages fit the column (2.5 hours) — HIGH

**Goal:** The page we just launched (campaign overview → Install / embed) does not blow out the layout.

### Known wide children

| Surface | Why it overflows |
|---------|------------------|
| Campaign header (`campaigns/[campaignId]/page.tsx`) | Title + badge + action buttons in one row |
| `CampaignTabs` | Line tabs (`Analytics / Referrals / Rewards / Emails / Integrations`) can `nowrap` past the column |
| `IntegrationGuide` | `lg:grid-cols-[220px_1fr]` + `<pre><code>` snippets with no wrap |
| `CampaignShareLinks` | Long referral / public URLs (truncate is there; parent may still lack `min-w-0`) |
| Widget studio / edit embed | Same snippet `<pre>` blocks |

### Tasks

- [ ] Campaign header: stack actions under the title below `md`; keep `flex-wrap` + `min-w-0` on the title.
- [ ] `CampaignTabs`: allow tab list to wrap or scroll **inside** the tab bar (`overflow-x-auto` on `TabsList` only).
- [ ] `IntegrationGuide`: left rail already scrolls on small screens; make the code `<pre>` `max-w-full overflow-x-auto` and the right panel `min-w-0`.
- [ ] Any `whitespace-nowrap` / `min-w-[…]` in campaign dashboard cards: wrap or constrain.
- [ ] Install / embed deep-link (`#integrations/iframe`) must still open the Embed tab after the layout fix.

### Files to modify

- `src/app/(dashboard)/brands/[brandId]/campaigns/[campaignId]/page.tsx`
- `src/components/campaigns/campaign-tabs.tsx`
- `src/components/campaigns/integration-guide.tsx`
- `src/components/campaigns/campaign-share-links.tsx`
- `src/components/campaigns/campaign-integration-panel.tsx` / `integration-embed-sections.tsx` if those snippets still overflow

---

## U3 — Full user-dashboard responsive pass (3.5 hours) — HIGH

**Goal:** Same shell rules on every member-facing dashboard route (not admin).

### Audit at 375 / 768 / 1280

Walk each route. If the **page** scrolls horizontally, fix that page. If the **app chrome** scrolls, you missed U1.

| Route | What to check |
|-------|----------------|
| `/dashboard` | Stat cards, brand cards, onboarding banner |
| `/stats` | Charts (`ResponsiveContainer`), campaign table |
| `/contacts` | Table already has `overflow-x-auto` on `lg` — confirm mobile list |
| `/brands`, `/brands/[id]` | Tables, brand dashboard panel |
| `/brands/[id]/campaigns` | Campaign list |
| `/brands/[id]/campaigns/new` | Wizard steps |
| `/brands/[id]/campaigns/[id]/edit` | Embed textarea, form grids |
| `/brands/[id]/campaigns/[id]/widget` | Studio preview + controls |
| `/billing`, `/billing/plan/[id]` | Plan cards, PayPal checkout |
| `/account` | Settings form |
| `/forum` | Topic rows |
| `/tools/*`, `/integrations/*` | Grids and code samples |

### Patterns to apply (do not invent a new design system)

- Flex/grid children that sit next to the sidebar: `min-w-0`.
- Tables: wrap in `overflow-x-auto` (table scrolls, page does not).
- Code / URLs: `break-all` or `truncate` + copy button.
- Grids: `grid-cols-1` default, then `sm:` / `lg:`.
- Touch targets ≥ 44px on mobile (header already uses `min-h-11` for the sidebar trigger).

### Out of scope

- Admin (`/admin/*`) — separate pass later unless a fix is one shared component.
- Public marketing pages — already have `overflow-x-hidden` on the public layout.
- Changing sidebar IA or nav labels (that was J2).

---

## U4 — Slug checker before creating a brand (2 hours) — HIGH

**Goal:** Never create a brand whose public slug is already taken. The member sees availability (and the `/p/{slug}` URL) **before** analyze/launch or manual create.

### Problem (reproduced Aug 15)

Two `member_urls` shared slug `blacksesameph` (older **1274** + onboarding brand **40395**). `findFirst({ where: { slug } })` hit 1274, so `/p/blacksesameph/campaign/21562` 404’d even though campaign 21562 belongs to 40395. 40395 was renamed to `blacksesameph-com` as a one-off.

**Create paths skip the checker.** Edit already calls `/api/brands/check-slug` (`brand-edit-panel.tsx`). Onboarding analyze + launch, `/api/brands` create, and admin new brand do not.

Launch now auto-suffixes via `uniqueBrandSlug` (`src/lib/brand-access.ts`) if the slug is taken — that is a safety net, not the UX. Do not rely on a silent rename after the member already copied a public URL.

### Tasks

- [ ] Reuse `/api/brands/check-slug` (do not invent a second endpoint). Extract the edit-panel check into a small shared helper if needed (`checkBrandSlug(slug, excludeBrandId?)`).
- [ ] **Onboarding** (`brand-analyzer.tsx` / `brand-results.tsx`): as soon as the URL is entered, derive the candidate slug (`slugifyDomain`) and show live available / taken. If taken, show the next unique suggestion (`blacksesameph-com`, then `-2`) and let the member confirm or type another before **Analyze** / **Launch**.
- [ ] **Manual create** (`brand-form.tsx` + `POST /api/brands`): same live checker as edit. Block submit when the slug is taken.
- [ ] **Admin new brand** (`admin/brands/new`): same checker.
- [ ] **Server must refuse collisions** even if the UI is skipped: `POST /api/brands`, analyze create, and launch must not write a slug already used by another `member_urls` row. Prefer `uniqueBrandSlug` or 409 `"Slug is not available"`.
- [ ] Do **not** add a unique index on `member_urls.slug` this sprint (shared MySQL; existing duplicates). Checker + write-time reject is enough.
- [ ] Do **not** edit `.env`.

### Files to modify

- `src/components/onboarding/brand-analyzer.tsx`, `brand-results.tsx`
- `src/components/brands/brand-form.tsx` (and create page that uses it)
- `src/app/(admin)/admin/brands/new/page.tsx`
- `src/app/api/brands/route.ts`, `src/app/api/brands/analyze/route.ts`, `src/app/api/brands/analyze/[jobId]/launch/route.ts`
- Existing: `src/app/api/brands/check-slug/route.ts`, `src/lib/brand-access.ts` (`uniqueBrandSlug`, `slugifyDomain`)

### Acceptance

- Entering `blacksesameph.com` when `blacksesameph` is taken shows **not available** and a unique alternative **before** the brand row is created.
- Launch / create never writes a duplicate slug.
- Edit slug checker still works (exclude current brand id).
- Public URL in the UI matches the slug that will actually be saved.

---

## U5 — Full-page campaign embed snippet (1.5 hours) — MEDIUM

**Goal:** Members can embed the **hosted public campaign page** (`/p/{slug}/campaign/{id}`) on their site, not only the widget.

### Problem (Aug 15)

Integrations only ship widget embeds:

- JS: `/widget.js?campaign={id}`
- iframe: `/widget/{id}/embed`

The designed landing (logo, headline, reward, join card, email/social/SMS) lives on `/p/{slug}/campaign/{id}`. There is no generated snippet for that full page. Linking works; embedding does not.

### Tasks

- [ ] Add a **Full page** snippet next to JS / iframe / Node in Integrations (`integration-guide.tsx`, `integration-embed-sections.tsx`, `campaign-integration-panel.tsx`).
- [ ] Generate it in `buildCampaignEmbedSnippets` (`src/lib/campaign-embed-snippets.ts`) using `publicCampaignUrl()` — iframe `src` = `/p/{slug}/campaign/{id}` (never `/public/`).
- [ ] Need the brand slug (or id fallback) in the snippet builder — pass `slugOrId` into `buildCampaignEmbedSnippets`, do not hardcode a domain.
- [ ] Sensible iframe defaults: `width="100%"`, `height` ~900 (or `min-height: 100vh`), `border:0`, `allow="clipboard-write; clipboard-read"`, `loading="lazy"`, title like “Referral campaign”.
- [ ] Copy button + short note: this embeds the **full public landing**, not the compact widget. Widget snippets stay as they are.
- [ ] Deep-link `#integrations/full-page` (same pattern as `#integrations/iframe`) from Install / embed if useful.
- [ ] Confirm `/p/{slug}/campaign/{id}` is iframe-friendly (no `X-Frame-Options: DENY` / restrictive CSP `frame-ancestors` on that route). If the public page is blocked in iframes, allow same-origin + member sites or document the limitation — do not weaken CSP on the dashboard.
- [ ] Do **not** edit `.env`.

### Files to modify

- `src/lib/campaign-embed-snippets.ts`
- `src/components/campaigns/integration-guide.tsx`
- `src/components/campaigns/integration-embed-sections.tsx`
- `src/components/campaigns/campaign-integration-panel.tsx`
- Call sites of `buildCampaignEmbedSnippets` (campaign page, edit page, wizard) — add slug argument
- `src/components/campaigns/campaign-tabs.tsx` if adding a hash

### Acceptance

- Integrations shows a copyable full-page iframe whose `src` opens the same landing as **Open public page**.
- Widget JS / widget iframe snippets are unchanged.
- Pasting the snippet on a test HTML page shows the professional two-column landing (not just the widget).
- Campaign 21562 / brand `blacksesameph-com` is the smoke test.

---

## Checklist summary

| Task | Hours | Priority | Status |
|------|-------|----------|--------|
| U1 — Dashboard shell: no horizontal scroll | 4.0 | Critical | ☐ |
| U2 — Campaign + Integrations fit the column | 2.5 | High | ☐ |
| U3 — Full user-dashboard responsive pass | 3.5 | High | ☐ |
| U4 — Slug checker before creating a brand | 2.0 | High | ☐ |
| U5 — Full-page campaign embed snippet | 1.5 | Medium | ☐ |
| **Total** | **13.5** | | |

### How to verify

1. Chrome DevTools responsive mode: 375, 768, 1024, 1280.
2. Confirm `document.documentElement.scrollWidth === document.documentElement.clientWidth` on the routes in U1 acceptance.
3. Open a launched campaign → **Install / embed** → Embed snippet is fully usable without panning the page.
4. Copy the new **Full page** snippet and confirm it loads `/p/{slug}/campaign/{id}`.
