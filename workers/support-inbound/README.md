# Support inbound Email Worker

Cloudflare **Email Routing** worker for `support@referrals.com`.

Parses the message with `postal-mime`, then POSTs to:

`POST https://www.referrals.com/api/webhooks/support-inbound`

with `Authorization: Bearer <SUPPORT_INBOUND_WEBHOOK_SECRET>`.

## When you need this

| Path | Needs this worker? |
|------|--------------------|
| Contact form → ticket + autoresponder + AI | **No** |
| Admin reply emails customer | **No** (app → SES/Resend) |
| Customer replies by email / new mail to support@ | **Yes** |

Without the worker, the admin inbox still works for contact-form tickets; email replies will not auto-thread.

## Setup

1. In Cloudflare → **Email Routing** for `referrals.com`, enable routing and create a rule:
   - Match: `support@referrals.com` (or catch-all)
   - Action: **Send to Worker** → `referrals-support-inbound`

2. Deploy the worker:

```bash
cd workers/support-inbound
pnpm install
npx wrangler secret put SUPPORT_INBOUND_WEBHOOK_SECRET
# paste the same value as in Next.js / Vercel
npx wrangler deploy
```

3. Confirm Next.js has the same secret and the webhook is live:

```env
SUPPORT_INBOUND_WEBHOOK_SECRET=…
```

4. Smoke test: email `support@referrals.com` with subject containing `RF-#####` from an open ticket, or a new subject — ticket should appear / update in `/admin/support`.

## Local

```bash
pnpm install
pnpm dev
# Wrangler exposes POST /cdn-cgi/handler/email for raw MIME fixtures
```

## Payload (matches app)

```json
{
  "fromEmail": "customer@example.com",
  "fromName": "Customer",
  "subject": "Re: [RF-00042] Help",
  "textBody": "…",
  "htmlBody": "…"
}
```
