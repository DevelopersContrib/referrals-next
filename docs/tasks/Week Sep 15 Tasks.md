# Week Sep 15 Tasks — Ronan

**Status:** **CLOSED** (Sept 14, 2026)  
**Sprint:** Sept 14–18, 2026 · **Owner:** Ronan  
**Source:** [`docs/sprint-sept-14-18.md`](../sprint-sept-14-18.md)

---

## Ronan — Stop the free product

| ID | Task | Pri | Est | Status |
|----|------|-----|-----|--------|
| **R1** | After trial, external is not free (`unpaid` entitlement, caps stay, widget visitors never 403) | Critical | 4h | ✅ |
| **R2** | R7 leftovers: `brand_missing` log + never stamp VNOC (`in_vnoc` **or** `vnoc_id`) | Critical | 1.5h | ✅ |
| **R3** | Trial-end cron + dashboard banner: pay $9/mo for `{domain}`, link `?brandId=` | High | 4h | ✅ |
| **R4** | Shared `plan-catalog` helper; billing + pricing import it; any paid planId stamps brand | High | 2.5h | ✅ |

**Sprint status (Ronan):** R1 ✅ · R2 ✅ · R3 ✅ · R4 ✅

---

## What shipped

### R1 — Unpaid external (not free SKU)
- `EntitlementStatus` adds `unpaid` for post-trial externals
- `getBrandEntitlement`: VNOC → `free_capped` + `isVnoc`; external without stamp → `unpaid`
- `getMemberEntitlement`: post-trial account → `unpaid` (not `free_capped`)
- Participant cap + branding gates unchanged; widget visitors still load

### R2 — VNOC + brand_missing
- `isVnocBrand()` checks `in_vnoc` **or** `vnoc_id`
- `activatePaidSubscription` skips `url_plan` / `member_urls.plan_expiry` for VNOC
- Checkout without `brandId` logs `brand_missing` event (account still activates)

### R3 — Trial-end truth
- `plan-expiry` cron: pay $9/mo for `{domain}`, no “free forever”
- Dashboard trial/unpaid banners: per-brand copy + `/billing/plan/2?brandId=`
- `/stats` subtitle updated for unpaid (totals only)

### R4 — Plan catalog
- `src/lib/plan-catalog.ts` — `splitPlanAudiences`, `getPlanFeatures`, `isMostPopularIndividual`, etc.
- `/billing` Available Plans uses helper (Individuals vs Partners, Most Popular)
- `/pricing` imports `PLAN_CATALOG_COPY`

---

## Verify locally

```bash
npx tsx scripts/smoke-brand-entitlement.ts
npx tsc --noEmit
```

Manual:
1. Post-trial external brand → status **Unpaid** on `/brands`, upgrade CTA with `?brandId=`
2. VNOC brand → **Network**, no upgrade CTA; PayPal with `brandId` does not stamp `url_plan`
3. Checkout without `brandId` → `brand_missing` row in `billing_checkout_events`
4. Trial banner + cron copy → “Keep {domain} — $9/mo”, not “free forever”
5. `/billing` → Individuals vs Partners sections, one Most Popular

---

## Jayson (same sprint — not Ronan)

J1–J5 (copy, CTAs, billing redesign polish, pricing match, brand list links) remain on Jayson’s board in the sprint doc.
