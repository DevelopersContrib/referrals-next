# Shopify integration — env + Vercel

OAuth connect flow: member opens **Integrations → Shopify**, enters a shop name, gets redirected to Shopify, then returns to `/api/integrations/shopify/oauth`.

## Required environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `SHOPIFY_CLIENT_ID` | Server only | OAuth token exchange (`ShopifyIntegration.exchangeOAuthCode`) |
| `SHOPIFY_CLIENT_SECRET` | Server only | OAuth token exchange |
| `NEXT_PUBLIC_SHOPIFY_CLIENT_ID` | Server + browser | Builds the authorize URL on `/integrations/shopify` |

`NEXT_PUBLIC_SHOPIFY_CLIENT_ID` must be the **same** Client ID as `SHOPIFY_CLIENT_ID` (the public half of the Shopify app credential pair).

Legacy names `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` still work locally as fallbacks; prefer `SHOPIFY_CLIENT_*` for new setups.

## Vercel (production / preview)

In the Vercel project → **Settings → Environment Variables**, add:

1. **`SHOPIFY_CLIENT_ID`** — Production, Preview, Development  
   Value: Client ID from [Shopify Partners](https://partners.shopify.com/) → your app → **Client credentials**.

2. **`SHOPIFY_CLIENT_SECRET`** — Production, Preview, Development  
   Value: Client secret from the same page. Mark as **Sensitive**.

3. **`NEXT_PUBLIC_SHOPIFY_CLIENT_ID`** — Production, Preview, Development  
   Value: same Client ID as `SHOPIFY_CLIENT_ID`.

Redeploy after changing env vars so server routes and the client bundle pick them up.

## Shopify Partner app settings

In the Shopify app → **Configuration**:

- **App URL:** `https://referrals.com` (or your `NEXT_PUBLIC_APP_URL`)
- **Allowed redirection URL(s):**
  - `https://referrals.com/api/integrations/shopify/oauth`
  - `http://localhost:3000/api/integrations/shopify/oauth` (local dev)

Scopes used: `read_products`, `read_orders`.

## Local setup

```bash
cp .env.local.example .env.local
# Fill SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, NEXT_PUBLIC_SHOPIFY_CLIENT_ID
```

## Smoke test

**Offline** — authorize URL shape only (no secrets; good for CI):

```bash
npx tsx scripts/smoke-shopify-oauth.ts
```

**Live** — also validates `.env.local` credentials:

```bash
npx tsx scripts/smoke-shopify-oauth.ts --live
```

Optional overrides:

```bash
SHOPIFY_CLIENT_ID=... NEXT_PUBLIC_SHOPIFY_CLIENT_ID=... \
  npx tsx scripts/smoke-shopify-oauth.ts --shop my-dev-store --app-url https://referrals.com
```

Pass = exit code `0`. Missing secrets or a malformed authorize URL = exit code `1`.
