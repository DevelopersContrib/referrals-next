# Week Oct 5 Tasks — Ronan

**Status:** **DONE** (Oct 5, 2026)  
**Owner:** Ronan  
**Builds on:** [`Week Sep 15 Tasks.md`](Week%20Sep%2015%20Tasks.md) (per-brand $9/mo) and commit `39af012` (no trial / pay to publish)

---

## Goal

Campaigns start as **Draft** (free, preview in dashboard). Owner clicks **Go Live** → checkout → campaign is **Live** (public `/p/` page, widget signups, share links). Unpaid or lapsed brands **pause** public campaigns (data kept). VNOC network brands and platform admins bypass payment. Public visitors see **“This campaign isn't live yet.”** on `/p/` when not live.

---

## Checklist

| Item | Status |
| ---- | ------ |
| Draft default for unpaid creates (`publish: private`) | ✅ (existing create path) |
| Campaign dashboard **Go Live** → `/billing/plan/2?brandId=&goLiveCampaign=` | ✅ |
| After PayPal activate → `publishCampaignGoLive` | ✅ |
| `POST /api/campaigns/[id]/go-live` when already entitled | ✅ |
| Public `/p/` + widget signup gated via `isCampaignPubliclyLive` | ✅ |
| Plan-expiry cron → `pauseBrandCampaignsWhenUnpaid` | ✅ |
| VNOC brands entitled without `url_plan` stamp | ✅ |
| Dashboard banner: **Your campaign is ready, go live for $9/mo** | ✅ |

---

## What shipped

### `src/lib/campaign-live.ts`

- `isCampaignPubliclyLive`, `getCampaignSurfaceState` (draft / live / paused)
- `publishCampaignGoLive`, `pauseBrandCampaignsWhenUnpaid`
- `CAMPAIGN_NOT_LIVE_PUBLIC_MESSAGE`

### Billing + go live

- Checkout metadata + confirm body: `goLiveCampaign`
- `activatePaidSubscription` publishes campaign after brand stamp
- Plan checkout page + PayPal in-page checkout thread `goLiveCampaign`

### UI / API

- `CampaignGoLiveButton`, share links disabled until live
- Public campaign page banner + preview join when not live
- `programNotLiveMessage()` aligned with public copy

---

## Verify locally

```bash
npx tsx scripts/smoke-brand-entitlement.ts
npx tsx scripts/smoke-campaign-og.ts
npx tsc --noEmit
```

Manual:

1. Unpaid campaign → badge **Draft**, **Go Live** opens checkout with `goLiveCampaign`
2. After pay → campaign **Live**, copy link + widget signup work
3. `/p/{slug}/campaign/{id}` while draft/unpaid → amber **This campaign isn't live yet.**
4. VNOC brand → **Go Live** without checkout (admin bypass same at API gates)
5. Dashboard top banner (unpaid) → **Your campaign is ready, go live for $9/mo**
