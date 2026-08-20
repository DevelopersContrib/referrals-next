# Referrals.com — REST API Reference

**Version:** v1
**Base URLs:**

| URL | When to use |
|-----|-------------|
| `https://referrals.com/api/v1` | Primary — works immediately |
| `https://api.referrals.com/v1` | Legacy subdomain — add `api.referrals.com` to Vercel, then `/v1/*` rewrites to `/api/v1/*` automatically |

**Authentication:** `X-API-Key` header with a `ref_*` key, or a JWT Bearer token from `/v1/auth/token`.

**Response format:** All endpoints return `{ "success": true, "data": ... }` on success or `{ "success": false, "error": "message" }` on failure.

**CORS:** All `/api/v1/*` endpoints send `Access-Control-Allow-Origin: *`.

**Pagination:** List endpoints support `?page=1&limit=20` (max 100).

---

## Authentication

### `POST /v1/auth/token`

Exchange email + password for a 30-day JWT.

**Auth:** None

```json
// Request
{ "email": "user@example.com", "password": "secret" }

// Response 200
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "member": { "id": 1, "email": "user@example.com", "name": "Jane" }
  }
}
```

---

## Members

### `POST /v1/members`

Register a new member (public).

**Auth:** None

```json
// Request
{ "email": "new@example.com", "name": "Jane Doe", "password": "securepass" }

// Response 201
{ "success": true, "data": { "id": 42, "email": "new@example.com", "name": "Jane Doe", "date_signedup": "2026-06-20T..." } }
```

### `GET /v1/members/profile`

Get the authenticated member's profile.

**Auth:** API Key

```json
// Response 200
{ "success": true, "data": { "id": 1, "email": "...", "name": "...", "plan_id": 2, "plan_expiry": "...", "is_verified": true } }
```

### `GET /v1/members/api-key`

Get the current API key.

**Auth:** API Key or Session

```json
// Response 200
{ "success": true, "data": { "api_key": "ref_abc123...", "date_generated": "2026-06-20T..." } }
```

### `POST /v1/members/api-key`

Generate a new API key. Previous keys remain valid.

**Auth:** API Key or Session

```json
// Response 201
{ "success": true, "data": { "api_key": "ref_newkey...", "date_generated": "2026-06-20T..." } }
```

---

## Brands

### `GET /v1/brands`

List all brands for the authenticated member. Supports `?page=1&limit=20`.

**Auth:** API Key

```json
// Response 200
{ "success": true, "data": { "brands": [...], "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 } } }
```

### `POST /v1/brands`

Create a new brand.

**Auth:** API Key

```json
// Request
{ "url": "https://mybrand.com", "description": "My Brand" }

// Response 201
{ "success": true, "data": { "id": 5, "url": "https://mybrand.com", "domain": "mybrand.com", "slug": "mybrand-com", ... } }
```

### `GET /v1/brands/:brandId`

Get a single brand by ID.

**Auth:** API Key

### `PUT /v1/brands/:brandId`

Update a brand.

**Auth:** API Key

```json
// Request
{ "description": "Updated description", "logo_url": "https://..." }
```

### `DELETE /v1/brands/:brandId`

Delete a brand and its campaigns.

**Auth:** API Key

### `GET /v1/brands/:brandId/stats`

Get brand analytics: campaigns, participants, shares, clicks, impressions.

**Auth:** API Key

---

## Campaigns

### `GET /v1/campaigns`

List campaigns. Filter with `?brand_id=5`. Supports pagination.

**Auth:** API Key

### `POST /v1/campaigns`

Create a new campaign. Requires an active subscription to publish as `"public"`.

**Auth:** API Key

```json
// Request
{
  "name": "Summer Promo",
  "url_id": 5,
  "type_id": 1,
  "reward_type": 1,
  "goal_type": "signup",
  "num_signups": 10,
  "publish": "public"
}

// Response 201
{ "success": true, "data": { "id": 100, "name": "Summer Promo", "publish": "public", ... } }
```

### `GET /v1/campaigns/:campaignId`

Get campaign details including widget config, reward settings, contest info, and email content.

**Auth:** API Key

### `PUT /v1/campaigns/:campaignId`

Update a campaign. Same fields as create.

**Auth:** API Key

```json
// Request
{ "name": "Updated Name", "publish": "public" }
```

### `DELETE /v1/campaigns/:campaignId`

Delete a campaign and all related records (widget, rewards, participants, shares, impressions, emails, coupons, contests).

**Auth:** API Key

### `GET /v1/campaigns/:campaignId/stats`

Get campaign stats: participants, shares, clicks, impressions, daily signup series.

**Auth:** API Key

---

## Participants

### `GET /v1/participants`

List participants across your campaigns. Filter with `?campaign_id=10`. Supports pagination.

**Auth:** API Key

### `GET /v1/participants/:participantId`

Get participant detail with shares, rewards, and invited emails.

**Auth:** API Key

---

## Signups

### `POST /v1/signups`

Register a participant signup externally. Triggers Mailchimp sync and Zapier webhooks if configured.

**Auth:** API Key

```json
// Request
{
  "campaign_id": 10,
  "email": "participant@example.com",
  "name": "John Doe",
  "referral_url": "https://mybrand.com/landing",
  "ip_address": "1.2.3.4"
}

// Response 201
{ "success": true, "data": { "id": 55, "campaign_id": 10, "email": "participant@example.com", ... } }
```

**Error 409:** Participant already signed up for this campaign.

### `POST /v1/signups/referral`

Process a referral signup with an encrypted referral code. Tracks who referred whom and automatically processes rewards.

**Auth:** API Key

```json
// Request
{ "referral_code": "base64_encoded_string", "email": "newuser@example.com", "name": "New User" }

// Response 201
{ "success": true, "data": { "participant": { "id": 55, ... }, "reward": { "type": "coupon", "value": "SAVE20" } } }
```

---

## Webhooks

Register outbound webhook URLs (Zapier-style). Events are fired on `participant.signup`, `participant.reward`, and `participant.share`.

### `GET /v1/webhooks`

List registered webhooks.

**Auth:** API Key

### `POST /v1/webhooks`

Register a new webhook URL.

**Auth:** API Key

```json
// Request
{ "link": "https://hooks.zapier.com/hooks/catch/123/abc", "campaign_id": 10 }
```

### `PUT /v1/webhooks/:webhookId`

Update a webhook URL or campaign.

**Auth:** API Key

### `DELETE /v1/webhooks/:webhookId`

Delete a webhook.

**Auth:** API Key

---

## Lander

### `GET /v1/lander?campaign_id=123`

Get lander page configuration for a campaign. Returns template, header/footer text, background settings, brand info, and social URLs.

**Auth:** API Key

```json
// Response 200
{
  "success": true,
  "data": {
    "lander": { "template": "default", "header_text": "...", "footer_text": "..." },
    "brand": { "domain": "mybrand.com", "logo_url": "..." },
    "social_urls": [{ "social": "twitter", "profile_url": "https://..." }]
  }
}
```

---

## Billing (Public)

### `GET /v1/billing/plans`

List all available subscription plans. No authentication required.

**Auth:** None

```json
// Response 200
{
  "success": true,
  "data": [
    { "id": 1, "name": "Free", "price": 0, "no_of_domains": 1, "campaigns_participants": 100 },
    { "id": 2, "name": "Premium", "price": 9, "no_of_domains": 10, "campaigns_participants": 0 }
  ]
}
```

---

## Zapier Integration

### `POST /v1/zapier/auth`

Validate an API key for Zapier's "Test Authentication" step.

**Auth:** API Key

### `GET /v1/zapier/contacts`

Polling trigger — returns participants as contacts. Filter with `?campaign_id=10`.

**Auth:** API Key

---

## Widget Embed URLs

These are the public URLs for embedding referral widgets. No API key needed.

| URL | Purpose |
|-----|---------|
| `GET /widget.js?campaign={id}` | JavaScript widget loader (auto-creates iframe) |
| `GET /api/widget/js/{id}` | Same loader (canonical path) |
| `GET /widget/{id}/embed` | iframe-ready widget page |
| `GET /widget/{id}` | Standalone widget preview |

### PHP-compatible widget endpoints (no `/api` prefix)

These paths are rewritten to `/api/widget/*` for backward compatibility with existing embed installations:

| URL | Purpose |
|-----|---------|
| `POST /widget/signup` | Participant signup |
| `POST /widget/share` | Record social share |
| `POST /widget/click` | Track referral click |
| `POST /widget/impression` | Record widget page view |
| `POST /widget/invite` | Send email invites (max 10) |
| `POST /widget/reward` | Claim reward |
| `POST /widget/vote` | Cast vote in contest |

### Share tracking

| URL | Purpose |
|-----|---------|
| `GET /t/{code}` | Referral link redirect + click tracking |
| `GET /t2/{code}` | Secondary tracking redirect |

---

## Embed Snippet Examples

### JavaScript (recommended)

```html
<div id="referrals-widget"></div>
<script src="https://referrals.com/widget.js?campaign=123" async></script>
```

### iframe

```html
<iframe
  src="https://referrals.com/widget/123/embed"
  title="Referral program"
  width="100%"
  height="560"
  style="border:0;max-width:100%;"
  loading="lazy"
  allow="clipboard-write; clipboard-read"
></iframe>
```

### Node.js (Express)

```javascript
import express from "express";
const app = express();
app.get("/refer", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Refer a friend</title></head>
  <body>
    <div id="referrals-widget"></div>
    <script src="https://referrals.com/widget.js?campaign=123" async></script>
  </body>
</html>`);
});
app.listen(3000);
```

---

## Network (VNOC operator)

### `GET /v1/network/referrals?domain={domain}`

Read-only referral performance for a **VNOC domain** (`member_urls.vnoc_id IS NOT NULL`). Non-VNOC or unknown domains return `{ found: false }` — never a non-VNOC brand. `domain` may be a host or URL (`www.` / protocol stripped).

**Auth:** `X-API-Key: NETWORK_READ_KEY` (network operator secret, not a member `ref_*` key)

```json
// 200 — VNOC domain with a referral brand
{
  "success": true,
  "data": {
    "found": true,
    "domain": "handyman.com",
    "vnoc_id": 411,
    "brand": { "id": 12, "url": "https://handyman.com", "domain": "handyman.com", "referral_campaign_id": 34 },
    "campaigns": [
      { "id": 34, "name": "Handyman Pros", "publish": "public", "reward_type": 2, "visits": 812, "signups": 143, "is_primary": true }
    ],
    "totals": { "campaigns": 1, "visits": 812, "signups": 143 }
  }
}

// 200 — not a VNOC referral brand
{ "success": true, "data": { "found": false, "domain": "example.com" } }
```

Missing/invalid key → 401. Missing `domain` → 400. POST/PUT/DELETE → 405.

---

## Rate Limits

No hard rate limits are currently enforced. Pagination defaults to 20 items, max 100.

## Error Codes

| HTTP | Meaning |
|------|---------|
| 400 | Bad request — missing or invalid parameters |
| 401 | Unauthorized — missing or invalid API key |
| 403 | Forbidden — subscription required or access denied |
| 404 | Not found |
| 409 | Conflict — duplicate (e.g. participant already signed up) |
| 500 | Internal server error |

## Legacy URL Compatibility

The following PHP-era URLs are automatically redirected or rewritten:

| Old URL | Handled as |
|---------|------------|
| `api.referrals.com/v1/*` | Rewritten to `/api/v1/*` (add domain in Vercel) |
| `/widget.js?campaign=ID` | Rewritten to `/api/widget/js/ID` |
| `/extension/widget.js?id=ID` | Same |
| `/widget/signup` (POST) | Rewritten to `/api/widget/signup` |
| `/widget/share` (POST) | Rewritten to `/api/widget/share` |
| `/widget/click` (POST) | Rewritten to `/api/widget/click` |
| `/widget/impression` (POST) | Rewritten to `/api/widget/impression` |
| `/widget/invite` (POST) | Rewritten to `/api/widget/invite` |
| `/widget/reward` (POST) | Rewritten to `/api/widget/reward` |
| `/widget/vote` (POST) | Rewritten to `/api/widget/vote` |
| `/public/{slug}/campaign/{id}` | Redirects to `/p/{slug}/campaign/{id}` |
| `/brand/dashboard/{id}` | Redirects to `/brands/{id}` |
| `/brand/edit/{id}` | Redirects to `/brands/{id}/edit` |
| `/brand/allbrands` | Redirects to `/brands/allbrands` |
| `/brand` | Redirects to `/brands` |
| `/plans` | Redirects to `/pricing` |
