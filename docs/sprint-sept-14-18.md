# Sprint — Sept 14–18, 2026

**Project:** Referrals.com (referrals-next)
**Window:** Monday Sept 14 – Friday Sept 18, 2026 (5 days)
**Created:** Sept 11, 2026 · **Product rule locked Sept 7 (Maida)**
**Theme:** Stop giving the product away. Funnel every external brand to **$9/mo**. **No free** except VNOC.

Prior board: [`docs/sprint-sept-7-11.md`](sprint-sept-7-11.md) (R1–R7 stamp shipped; R7 leftovers are **R2** this week).

One board. **Kareen is not on this sprint.** Jayson = marketing + CTAs. Ronan = entitlement / paywall / brand stamp.

Do **not** edit `.env`. Do **not** touch PayPal checkout UI (`/billing/plan/[planId]`, `paypal-checkout.tsx`). Shared MySQL: additive SQL only. **Public widgets must never 403 visitors** because the owner did not pay. No unique index on `member_urls.slug`.

| Who | Focus | Hours |
|-----|--------|-------|
| **Jayson** | Billing + public plan cards; unpaid CTAs; brand list → brand dashboard | 16.5 |
| **Ronan** | Plan catalog helper + any paid plan stamps a brand; no free product after trial | 12.0 |

---

# Why people do not buy today

The widget **keeps working after trial for $0** (`free_capped`: 1 domain, 500 participants, branding on). Then we ask for $9. There is no reason to pay.

**Locked rule:** VNOC (`in_vnoc` / `vnoc_id`) is the **only** free brand. External brands: 14-day Growth trial, then **$9/mo per brand**. No free-forever SKU. Trial is not a plan — it ends.

---

# Funnel (this is the week)

```
Signup (no card) → 14-day Growth on first external brand
  → use the live widget / first referrals
  → day 12–14: “Keep this brand — $9/mo”
  → PayPal /billing/plan/2?brandId=
  → that brand Active; next external brand is another $9
VNOC brands: never enter this funnel
```

Do **not** offer a working free program after trial. Visitors on an unpaid external widget still load (branding on). The **owner** cannot add brands, hide branding, see full stats, or stay on Growth without paying that brand.

---

# Verified (do not re-litigate)

| Claim | Verdict |
|---|---|
| App still allows free after trial | **True.** `getMemberEntitlement` → `free_capped`. Widget stays live. |
| $9 stamps one brand | **True (R7).** `url_plan` + `member_urls.plan_expiry`. No `brandId` still unlocks the **account**. |
| VNOC can still get an `url_plan` | **True leftover.** Activate does not refuse `in_vnoc` / `vnoc_id`. Entitlement only reads `in_vnoc`. |
| Checkout with no `brandId` | **True leftover.** No `brand_missing` log. |
| “Free forever” is still on marketing | **True.** `/pricing`, homepage, signup, knowledgebase, `/stats` subtitle, trial emails. |
| Public widget 403 on `free_capped` | **Must stay false.** Visitors are not the customer. |

---

# Jayson — Copy + CTAs

## J1 — Kill “free forever” on the public funnel (4h) — CRITICAL

Surfaces: `/pricing`, homepage pricing, `/signup` + `SignupForm`, `/features`, knowledgebase plans, ROI calculator, `use-cases.ts`.

- One offer: **14-day Growth trial**, then **$9/mo per brand**
- One footnote: **VNOC / network domains stay free**
- Delete “then free forever (capped)” as a plan people can keep
- Growth card: “$9/month **for this brand**” — not “unlimited domains for $9”
- Do not invent a $0 external SKU on `/billing`

**Done when:** a new visitor cannot find a free-forever plan for their own domain.

## J2 — Unpaid external always has a buy path (4h) — HIGH

Depends on **R1** for “this brand must pay.”

- Dashboard brand card, `/brands` badge, brand edit (“Upgrade to Premium” → **Growth**), `/stats` upgrade, onboarding second-domain, trial banner
- CTA → existing `/billing/plan/2?brandId=` only
- Copy: “Growth — $9/mo for this brand.” VNOC = Free / Network, no CTA. Paid = Active, no CTA
- Trial banner: “Keep **this brand** — $9/mo” (not account-wide Free forever)

## J3 — `/billing` Available Plans redesign (4h) — CRITICAL

**Maida, Sept 11:** Current 6-card grid is tacky (identical cards, individuals + partners mixed, $0 → $9 → $1,999 in one row). Spec: `cursor-prompt-billing-page-redesign.md` (repo sibling). Use Ronan’s **R4** helper — do not duplicate grouping logic.

**Keep:** `plans.findMany()`, links `/billing/plan/${id}`, Current status + Payment History, checkout page / `paypal-checkout.tsx` untouched.

**Do (Available Plans only):**

1. Two sections: **For Individuals** (name does not contain “Partner”) vs **For Partners & Agencies** (name contains “Partner”). Partner subtext: “Multi-brand plans for agencies and resellers.”
2. **Most Popular** on the cheapest paid individual plan (price > 0, sort by price). Purple pill `absolute -top-3 left-1/2 -translate-x-1/2`, stronger ring/shadow, thicker gradient bar
3. Richer features via `getPlanFeatures` (R4) — not just brands / participants / “30 days”
4. “Billed monthly” / “Billed annually”; annual also show `~$X/mo`
5. CTA = `Get ${plan.name}` (current plan stays “Current plan”)
6. Free DB row: **minimal** card (no “Free forever” for external brands). Footnote: **VNOC / network domains stay free.** Trial is how externals start — not a $0 SKU
7. Mobile: 1 col, `min-h-11`, no page-level horizontal scroll

**Done when:** 6 plans still render and link. One “Most Popular.” Partners are a separate block. Build passes.

## J4 — Public `/pricing` + homepage match billing (3h) — HIGH

Same catalog as **J3** / **R4** — not a second invented layout.

- `/pricing` and homepage pricing: Individuals vs Partners, Most Popular on $9/brand, annual `~$X/mo`
- Do **not** lead with a “Free forever” hero card. $0 row = trial / VNOC footnote
- Public CTAs: signup / trial for unpaid visitors; logged-in Growth still `/billing/plan/{id}`
- Same colors (`#926efb` / `#FF5C62`). Do not edit checkout

**Done when:** a visitor and a member see the **same plan story**.

## J5 — Brand list opens that brand’s dashboard (1.5h) — HIGH

**Maida, Sept 11:** On the user dashboard, the brands list should be clickable through to **that brand’s page dashboard** (`/brands/{id}` — the page that says `{domain} Dashboard`).

Verified today: `/dashboard` “Your Brands” only overlays the image block. `/brands` only links the domain name + an Open/Dashboard button. Clicking the rest of the card/row does nothing. Sidebar “My Brands” already goes to `/brands/{id}` — keep that.

**Do:**

- `/dashboard` Your Brands: click the card (logo, domain, stats) → `/brands/{id}`. Pointer + hover so it reads as a link
- `/brands` mobile cards + desktop table: click the row/card (name, logo, empty cells) → `/brands/{id}`
- Do **not** nest Upgrade, New campaign, Edit, or the external website URL inside that same link — those stay their own targets
- Keyboard: brand name remains a real `<Link>` (not click-via-JS only)
- Do not change `/brands/{id}` itself. Do not edit checkout

**Done when:** from `/dashboard` and `/brands`, clicking a brand opens that brand’s dashboard. Upgrade / Edit / New campaign still work.

---

# Ronan — Stop the free product

## R1 — After trial, external is not free (4h) — CRITICAL

`free_capped` must mean **unpaid / must buy**, not “keep using the product.”

- `getBrandEntitlement`: VNOC → free (no paywall). Account **trial** → Growth. External with `url_plan` / future `member_urls.plan_expiry` → paid. Else → unpaid (not a free SKU)
- Unpaid external: cannot add another domain, cannot hide Powered-by, `/stats` totals only, participant cap stays
- **Do not** 403 `/api/widget/signup` visitors or take the embed down
- VNOC: no checkout, no upgrade. 500-cap stays unless Maida says unlimited

**Done when:** a post-trial external brand without `url_plan` is not treated as a happy free customer.

## R2 — R7 leftovers: `brand_missing` + never stamp VNOC (1.5h) — CRITICAL

Sept R7 **stamp is shipped**. Do not rebuild activate. Close these holes only:

- If activate has **no** `brandId` (after checkout-attempt lookup): still activate the **account** (don’t break PayPal) and log checkout event `brand_missing` so we can fix CTAs
- Never write `url_plan` or `member_urls.plan_expiry` when the brand is VNOC (`in_vnoc` **or** `vnoc_id`)
- `getBrandEntitlement` `isVnoc` = `in_vnoc` **or** `vnoc_id` (not `in_vnoc` only)
- Do not send VNOC to `/billing/plan/2` (J5 already hides CTA — keep it that way)
- Do not edit `paypal-checkout.tsx`

**Done when:** unpaid VNOC never gets an `url_plan` even if `brandId` is posted. Checkout without `brandId` leaves a `brand_missing` log row.

## R3 — Trial-end tells the truth (4h) — HIGH

`src/app/api/cron/plan-expiry/route.ts` + dashboard trial card.

- Subject/body: trial ending → **pay $9/mo for {domain}** to keep Growth
- Remove “after that you stay free forever”
- If they do not pay: widget stays live for visitors (branding on); owner sees unpaid, not “Free forever”
- Link: `/billing/plan/2?brandId=` when known

## R4 — Shared plan catalog + any paid plan stamps a brand (2.5h) — HIGH

Jayson must not hard-code Partner vs Individual in two pages.

Add `src/lib/plan-catalog.ts` (or similar) used by `/billing` and `/pricing`:

- `isPartnerPlan(name)`, `splitPlanAudiences(plans)`, `isAnnual(plan)`, `monthlyEquivalent(plan)`, `isMostPopularIndividual(plan, plans)`, `getPlanFeatures(plan)` — match the billing redesign prompt
- Do not hide extra `plans` rows; do not invent prices
- **Product:** $0 row is not a free-forever SKU for external brands. Helper can expose `freeIsVnocOnly: true` copy keys. Entitlement stays **R1** (VNOC free, external pays)
- Activate / `url_plan` must work for **any** paid `plan.id` (Unlimited, Partner, Sale), not only plan 2. Still no `url_plan` on VNOC (**R2**)
- Do not edit `paypal-checkout.tsx`

**Done when:** billing + pricing import the same helper. Paying Partner Premium stamps that `brandId` the same way $9 does.

---

# Hours

| ID | Owner | Hours | Pri | Verified? |
|----|-------|-------|-----|-----------|
| J1 Kill free-forever copy | Jayson | 4.0 | Critical | Yes |
| J2 Buy path on unpaid external | Jayson | 4.0 | High | Yes |
| **J3 `/billing` plans redesign** | **Jayson** | **4.0** | **Critical** | **Yes** |
| J4 Public pricing matches billing | Jayson | 3.0 | High | Yes |
| J5 Brand list → brand dashboard | Jayson | 1.5 | High | Yes |
| **R1 No free product after trial** | **Ronan** | **4.0** | **Critical** | **Yes** |
| **R2 R7 leftovers (VNOC + `brand_missing`)** | **Ronan** | **1.5** | **Critical** | **Yes** |
| R3 Trial-end copy + cron | Ronan | 4.0 | High | Yes |
| R4 Shared plan catalog + any planId stamps brand | Ronan | 2.5 | High | Yes |
| **Total** | | **28.5** | | |

Parked: +30d on paid invitee; widget.js static/dynamic; `/api/brand` auto-provision; VNOC uncapped; lander worker (other repo).

### How to verify

1. New signup → trial → add external brand → widget works.
2. After trial, that brand is **unpaid** (not Free forever). CTA → `/billing/plan/2?brandId=`.
3. Pay → only that brand Active. Second external brand still asks for $9.
4. VNOC brand: no CTA, no checkout.
5. Visitor on unpaid widget: page loads, branding on, no 403.
6. `/billing`: Individuals vs Partners, one Most Popular, all 6 plans still checkout. `/pricing` + homepage match. $0 is not sold as free-forever for external brands. VNOC = footnote.
7. `/dashboard` and `/brands`: click a brand → `/brands/{id}` dashboard. Upgrade / Edit / New campaign still work.

---

# VNOC paste (this repo only)

1. **J1 — Kill “free forever” on pricing/signup/homepage** · Jayson · 4h · Critical  
2. J2 — Unpaid external CTA → `/billing/plan/2?brandId=` · Jayson · 4h · High  
3. **J3 — `/billing` Available Plans redesign** (Individuals vs Partners, Most Popular) · Jayson · 4h · Critical  
4. J4 — Public `/pricing` + homepage match billing catalog · Jayson · 3h · High  
5. **J5 — Brand list clickable → that brand’s `/brands/{id}` dashboard** · Jayson · 1.5h · High  
6. **R1 — After trial, external is not a free product** · Ronan · 4h · Critical  
7. **R2 — R7 leftovers: `brand_missing` log + never stamp VNOC** · Ronan · 1.5h · Critical  
8. R3 — Trial-end email/banner: pay $9 for this brand · Ronan · 4h · High  
9. **R4 — Shared `plan-catalog` helper; any paid planId stamps brand** · Ronan · 2.5h · High  
