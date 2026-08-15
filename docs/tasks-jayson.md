# Jayson — Task List (12.5 hours)

**Project:** Referrals.com (referrals-next)
**Role:** Web UI
**Sprint focus:** Page builds, component polish, navigation, and content
**Created:** June 20, 2026

> **Next sprint (Aug 18–22):** dashboard overflow, slug checker, and a full-page campaign embed — see [`docs/tasks-ui-sprint-aug-18-22.md`](./tasks-ui-sprint-aug-18-22.md) (U1–U5). That file supersedes **J7** below.

---

## J1 — Stats Page Charts & Visuals (3 hours) — HIGH

**Goal:** Replace the "charts placeholder" on `/stats` with real chart components.

### Current state

The stats page at `src/app/(dashboard)/stats/page.tsx` has:
- 6 stat cards with real data (participants, shares, clicks, impressions, rewards, campaigns) — **working**
- A "Performance Over Time" section that says *"Charts and graphs will be displayed here"* — **placeholder**
- A per-campaign table that only shows name and ID — **incomplete**

### Tasks

- [ ] Install `recharts` charting library: `pnpm add recharts`
- [ ] Create a client component `src/components/dashboard/stats-chart.tsx`:
  - Accepts data as props (array of `{ label, value }` or time-series `{ date, value }`)
  - Uses Recharts `ResponsiveContainer`, `AreaChart` or `LineChart`
  - Matches the dashboard color scheme (brand purple `#6366f1`, slate grays)
  - Mobile-responsive (stacks on small screens)
- [ ] Replace the placeholder div in `/stats` (line 93-96) with the chart component
- [ ] Improve the per-campaign table (lines 108-130):
  - Add columns for Participants, Shares, Clicks (data is already queried in the page)
  - Add alternating row colors
  - Link campaign names to their dashboard pages
- [ ] Add a date range filter UI at the top (7 days / 30 days / 90 days / All time) — can be visual only for now with a `TODO` for wiring
- [ ] Reference: `src/components/brands/simple-line-chart.tsx` has an existing simple chart you can reuse or extend

### Files to create/modify

- **Create:** `src/components/dashboard/stats-chart.tsx`
- **Modify:** `src/app/(dashboard)/stats/page.tsx`

---

## J2 — Sidebar Navigation Cleanup (1.5 hours) — MEDIUM

**Goal:** Add missing page links to the sidebar and fix duplicate/overlapping items.

### Current state

`src/components/dashboard/sidebar.tsx` has three nav groups: Main, Tools (collapsible), and Quick Links. Several working pages have no sidebar entry.

### Missing from sidebar

| Page | Route | Suggested location |
|------|-------|--------------------|
| Shopify integration | `/integrations/shopify` | New "Integrations" group or under Tools |
| Mailchimp integration | `/integrations/mailchimp` | Same |
| Facebook tool | `/tools/facebook` | Under Tools nav |
| Bulk brand import | `/brands/bulk` | Under Brands or as button on brands list |

### Overlap

- `/promotions` (in sidebar under Tools) — has form + list
- `/tools/promotion` (in tools hub grid) — read-only list of same data

### Tasks

- [ ] Open `src/components/dashboard/sidebar.tsx`
- [ ] Add an **Integrations** section to `toolsNav` array:
  - `{ title: "Shopify", href: "/integrations/shopify", icon: ShoppingCartIcon }`
  - `{ title: "Mailchimp", href: "/integrations/mailchimp", icon: MailIcon }`
  - `{ title: "Facebook", href: "/tools/facebook", icon: FacebookIcon }` (or a generic social icon from lucide)
- [ ] Import the new icons from `lucide-react` at the top of the file
- [ ] Open `src/app/(dashboard)/tools/page.tsx`
- [ ] Remove the "Promotion" card from the tools hub grid (line ~38-41) since `/promotions` is the primary route
- [ ] Add an "Integrations" card linking to the three integration pages
- [ ] On `src/app/(dashboard)/brands/page.tsx` — if there's a "Create Brand" button area, add a secondary "Bulk Import" link to `/brands/bulk`
- [ ] Verify all sidebar links navigate correctly with no 404s

### Files to modify

- `src/components/dashboard/sidebar.tsx`
- `src/app/(dashboard)/tools/page.tsx`

---

## J3 — Knowledgebase Article Pages (2.5 hours) — MEDIUM

**Goal:** Build individual article pages so the knowledgebase links actually work.

### Current state

`src/app/(public)/knowledgebase/page.tsx` has 6 categories with 26 article links — but all links are `#hash` anchors that scroll nowhere. No individual article pages exist.

### Categories & articles (26 total)

- Getting Started (4): creating account, adding brand, first campaign, embedding widget
- Campaigns (5): types, goals, rewards, coupons, social sharing
- Widgets & Embedding (4): embed code, widget modes, customization, Shopify
- Billing & Plans (4): understanding plans, PayPal, upgrading, cancellation
- Integrations (5): Mailchimp, Shopify, Zapier, REST API, webhooks
- Analytics & Tracking (4): dashboard stats, click/share tracking, exporting, share links

### Tasks

- [ ] Create `src/app/(public)/knowledgebase/[slug]/page.tsx` — a dynamic article page
- [ ] Define article content as a static data map (object or array) with:
  - `slug` (URL-friendly)
  - `title`
  - `category`
  - `content` (can be JSX or markdown-style HTML — 2-4 paragraphs per article)
  - Write helpful, practical content based on how the platform actually works
- [ ] Update `src/app/(public)/knowledgebase/page.tsx`:
  - Change `slug: "#creating-account"` → `slug: "creating-account"` (remove `#`)
  - Link each article to `/knowledgebase/creating-account` etc.
- [ ] Article page layout:
  - Breadcrumb: Home > Knowledgebase > Category > Article
  - Article title (h1)
  - Content body with proper typography (prose styling)
  - "Related articles" sidebar or bottom section showing other articles in same category
  - Back link to knowledgebase index
- [ ] Match the public site styling (white background, max-w-4xl, same header/footer)
- [ ] Add metadata (title, description, OG tags) per article

### Files to create/modify

- **Create:** `src/app/(public)/knowledgebase/[slug]/page.tsx`
- **Modify:** `src/app/(public)/knowledgebase/page.tsx` (fix links)

---

## J4 — Walkthrough Page Screenshots (1.5 hours) — MEDIUM

**Goal:** Replace text-only walkthrough steps with actual screenshots/visuals.

### Current state

`src/app/(public)/walkthrough/page.tsx` has 8 walkthrough steps with text descriptions but **zero screenshots or images**. Each step is just a numbered card with a paragraph.

### Tasks

- [ ] Take screenshots of the actual platform for each step:
  1. Create Your Account → screenshot of `/signup` page
  2. Add Your Brand → screenshot of `/brands/new` form
  3. Create a Campaign → screenshot of campaign wizard step 1
  4. Customize Your Widget → screenshot of widget editor
  5. Set Up Rewards → screenshot of rewards configuration
  6. Embed on Your Site → screenshot of the integration/embed panel
  7. Monitor Your Dashboard → screenshot of `/dashboard` or `/stats`
  8. Reward Your Referrers → screenshot of rewards/participants page
- [ ] Save images to `public/images/walkthrough/` (create the folder)
- [ ] Update the walkthrough page:
  - Add an `image` field to each step in the `walkthroughSteps` array
  - Display the image above or beside each step description
  - Use `next/image` for optimized loading
  - Alternate image left/right on desktop (zigzag layout)
  - Stack vertically on mobile
- [ ] Add border/shadow to screenshots for polish
- [ ] Optional: add a "Try it now" CTA button after the last step linking to `/signup`

### Files to modify

- `src/app/(public)/walkthrough/page.tsx`
- **Create folder:** `public/images/walkthrough/`

---

## J5 — Build Out Stub Tool Pages (2 hours) — MEDIUM

**Goal:** Turn the placeholder tool pages into functional-looking UIs.

### Pages to build out

#### `/tools/banners` — Banner Management
Current: drag-drop shell with "Choose File" button that does nothing, empty banner list.

- [ ] Wire the "Choose File" button to an `<input type="file">` with image preview
- [ ] Add a form with fields: Banner Name, Target Campaign (dropdown), Link URL
- [ ] Display uploaded banners in a grid with thumbnail, name, date, and delete button
- [ ] Use the existing `/api/upload` route for file uploads
- [ ] Show banner dimensions and file size after upload

#### `/tools/ads` — Ads Page
Current: three stat cards showing "0", empty campaign list.

- [ ] Add a "Create Ad Campaign" button (can open a dialog or link to a form)
- [ ] Design the ad creation form: Campaign to promote (dropdown), Daily budget, Target audience, Duration
- [ ] Add an "Ad Preview" card showing how the ad would appear on the platform
- [ ] Note: this can be UI-only for now — mark as "Beta" or "Coming Soon" for the submit action

#### `/tools/partnerships` — Partnerships
Current: "coming soon" text, empty partner list, static "How it works" section.

- [ ] Add a brand search/browse UI:
  - Search input with filter
  - Grid of brand cards showing logo, name, domain, campaign count
  - "Request Partnership" button on each card
- [ ] This can pull from `/api/brands/all` (existing endpoint)
- [ ] Add a "My Partnership Requests" section with status badges (Pending, Accepted, Declined)

### Files to modify

- `src/app/(dashboard)/tools/banners/page.tsx`
- `src/app/(dashboard)/tools/ads/page.tsx`
- `src/app/(dashboard)/tools/partnerships/page.tsx`

---

## J6 — Billing Page Cancel & Error UI (1 hour) — HIGH

**Goal:** Add cancel/reactivate buttons and error display to the billing page.

### Current state

`src/app/(dashboard)/billing/page.tsx` shows current plan, available plans, and payment history. But:
- No "Cancel Subscription" button even though `/api/billing/cancel` exists
- No "Reactivate" button even though `/api/billing/reactivate` exists
- PayPal redirects to `/billing?error=message` on failure but the page ignores query params

### Tasks

- [ ] Read `src/app/(dashboard)/billing/page.tsx` for current layout
- [ ] Add an **error banner** at the top of the page:
  - Read `searchParams.error` from the URL
  - If present, show a red alert box with the error message and a dismiss (X) button
  - Style: `bg-red-50 border border-red-200 text-red-800 rounded-lg p-4`
- [ ] Add a **Cancel Subscription** button:
  - Show only when member has an active paid plan (plan_id > 0, not expired)
  - Style as a destructive/outline button: `variant="outline"` with red text
  - On click, show a confirmation dialog: "Are you sure you want to cancel? You'll keep access until your billing period ends."
  - On confirm, call `POST /api/billing/cancel` with `{ memberId }`
  - Show success toast on completion, refresh page
- [ ] Add a **Reactivate** button:
  - Show only when plan is cancelled but not yet expired (need to check agreement status)
  - Style as a primary button
  - Call `POST /api/billing/reactivate` with `{ memberId }`
  - Show success toast, refresh page
- [ ] Both buttons should show loading spinners during API calls

### Files to modify

- `src/app/(dashboard)/billing/page.tsx` (may need to extract a client component for the buttons)

---

## J7 — Mobile Responsiveness Audit (1 hour) — LOW

**Goal:** Ensure all dashboard pages look good on mobile/tablet.

### Tasks

- [ ] Test the following pages at 375px (mobile) and 768px (tablet) viewport widths:
  - `/dashboard` — stat cards, brand cards
  - `/brands` — table layout
  - `/brands/[id]` — brand dashboard panel
  - `/brands/[id]/campaigns/new` — campaign wizard steps
  - `/stats` — stat cards and chart area
  - `/billing` — plan cards grid
  - `/forum` — topic list
  - `/contacts` — participant table
  - `/account` — settings form
- [ ] Fix any issues found:
  - Tables that overflow horizontally → add `overflow-x-auto` wrapper
  - Grids that don't stack → verify `sm:grid-cols-*` breakpoints
  - Text that overflows → add `truncate` or `break-words`
  - Buttons that are too small → ensure minimum touch target (44px)
  - Sidebar collapse behavior on mobile
- [ ] Document any issues you can't fix as comments in the relevant files

### Files to modify

- Various page and component files as issues are found

---

## Checklist Summary

| Task | Hours | Priority | Type | Status |
|------|-------|----------|------|--------|
| J1 — Stats page charts & visuals | 3.0 | High | Component build | ☐ |
| J2 — Sidebar navigation cleanup | 1.5 | Medium | Navigation UI | ☐ |
| J3 — Knowledgebase article pages | 2.5 | Medium | Page build + content | ☐ |
| J4 — Walkthrough page screenshots | 1.5 | Medium | Visual content | ☐ |
| J5 — Build out stub tool pages | 2.0 | Medium | Page builds | ☐ |
| J6 — Billing cancel & error UI | 1.0 | High | Component build | ☐ |
| J7 — Mobile responsiveness audit | 1.0 | Low | QA / polish | ☐ |

