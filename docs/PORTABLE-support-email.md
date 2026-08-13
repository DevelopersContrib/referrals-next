# Portable Support + Autoresponder + AI — Referrals.com

| Item | Value |
|------|--------|
| Domain | `referrals.com` |
| `site` / ticket prefix | `referrals` / `RF-#####` |
| Support address | `support@referrals.com` |
| Mail | AWS SES or Resend via `@contrib/mail` |
| Admin inbox | `/admin/support` |
| AI agent | OpenAI on contact form (`SUPPORT_AI_ENABLED`) |
| Inbound webhook | `POST /api/webhooks/support-inbound` |

## Modules

```
modules/mail/
modules/support-autoresponder/
modules/engagement/          # Emails & AI nurture
```

Admin: **Support Inbox** → `/admin/support` · **Emails & AI** → `/admin/engagement`

## Database tables

Support uses **two new tables** on the shared MySQL DB (`referral_program`). No engagement/nurture tables are created for this port.

| Table | Purpose |
|-------|---------|
| `support_tickets` | One row per conversation (contact form or inbound email) |
| `support_ticket_messages` | Thread messages (customer, AI agent, staff, internal notes) |

Isolation from Handyman / Developers.Contrib: filter by `site = 'referrals'`. Public IDs look like `RF-#####`.

### `support_tickets`

| Column | Type | Notes |
|--------|------|--------|
| `id` | INT PK | Internal id (admin URLs use this) |
| `public_id` | VARCHAR(24) UNIQUE | e.g. `RF-00042` — shown in email subjects |
| `member_id` | INT NULL | Optional link to logged-in member |
| `requester_email` | VARCHAR(255) | Customer email |
| `requester_name` | VARCHAR(120) | Customer name |
| `source` | VARCHAR(40) | `contact_form` \| `inbound_email` |
| `site` | VARCHAR(40) | Always `referrals` for this app |
| `subject` | VARCHAR(200) | Ticket subject |
| `category` | VARCHAR(40) | Default `other` |
| `priority` | VARCHAR(20) | Default `normal` |
| `status` | VARCHAR(40) | `open`, `waiting_on_staff`, `waiting_on_contractor`, `resolved`, `closed` |
| `assigned_admin_id` | INT NULL | Optional staff owner |
| `ai_handling` | TINYINT(1) | `1` while AI owns the thread |
| `ai_turn_count` | INT | AI replies so far (cap before escalate) |
| `escalated_at` | DATETIME NULL | When AI handed off to staff |
| `escalation_reason` | VARCHAR(500) | Why AI escalated |
| `last_message_at` | DATETIME | Queue sort key |
| `created_at` / `updated_at` | TIMESTAMP | Audit |

Indexes: `(site, status, last_message_at)`, `(requester_email)`.

### `support_ticket_messages`

| Column | Type | Notes |
|--------|------|--------|
| `id` | INT PK | |
| `ticket_id` | INT FK → `support_tickets.id` | CASCADE delete |
| `author_type` | VARCHAR(20) | `customer` \| `agent` \| `staff` |
| `author_id` | INT NULL | Staff/member id when known |
| `body` | TEXT | Message body |
| `is_internal` | TINYINT(1) | `1` = staff-only note (not emailed) |
| `created_at` | TIMESTAMP | |

Indexes: `(ticket_id)`, `(ticket_id, created_at)`.

### Apply support migration

```bash
mysql … referral_program < prisma/sql/support_inbox.sql
```

## Emails & AI (engagement) tables

Port of Handyman `/panel/engagement`. Admin UI: `/admin/engagement`.  
`user_id` = `members.id`. Isolation: `domain_key = 'referrals'`.

| Table | Purpose |
|-------|---------|
| `engagement_segments` | Audience rules (AI or default) |
| `engagement_campaigns` | Named sequences + optional segment link |
| `engagement_steps` | Emails in a campaign (subject/body/delay) |
| `engagement_enrollments` | Per-member enrollment / next send time |
| `engagement_sends` | Idempotent send log |

```bash
mysql … referral_program < prisma/sql/engagement_emails_ai.sql
pnpm prisma generate
```

## Env

```env
EMAIL_PROVIDER=resend   # or ses
RESEND_API_KEY=re_…
AWS_ACCESS_KEY_ID=…
AWS_SECRET_ACCESS_KEY=…
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=support@referrals.com
CONTACT_EMAIL=support@referrals.com
SUPPORT_FROM_EMAIL=support@referrals.com
SUPPORT_AUTORESPONDER=1
SUPPORT_AI_ENABLED=1
OPENAI_API_KEY=…
OPENAI_SUPPORT_MODEL=gpt-4o-mini
SUPPORT_INBOUND_WEBHOOK_SECRET=…

# Emails & AI
ENGAGEMENT_ENABLED=1
ENGAGEMENT_VNOC_CAMPAIGN_ID=   # optional VNOC leadmail sync
ENGAGEMENT_VNOC_DOMAIN_ID=971
VNOC_DATABASE_URL=…            # already used by Referrals
```

## Flow

1. `/contact` or `/api/contacts` POST → ticket + autoresponder + AI first reply (if enabled)
2. AI escalates → `waiting_on_staff` + ops email
3. Admin reply → customer email with `Re: [RF-#####]`
4. Inbound email → Cloudflare Email Worker → webhook → thread on same ticket

## Cloudflare Email Worker (inbound)

Required **only** so customer replies / mail to `support@referrals.com` land in `/admin/support`. Contact form + AI + staff outbound mail work without it.

| Piece | Location |
|-------|----------|
| Worker | `workers/support-inbound/` |
| Webhook | `POST /api/webhooks/support-inbound` |
| Secret | `SUPPORT_INBOUND_WEBHOOK_SECRET` (same in Worker secret + Next `.env`) |

```bash
cd workers/support-inbound
pnpm install
npx wrangler secret put SUPPORT_INBOUND_WEBHOOK_SECRET
npx wrangler deploy
```

Then in Cloudflare Email Routing: `support@referrals.com` → **Send to Worker** `referrals-support-inbound`. See `workers/support-inbound/README.md`.

## Files

```
src/lib/mail-send.ts
src/lib/support-autoresponder.ts
src/lib/support-email-tickets.ts
src/lib/support-tickets.ts
src/lib/support-ticket-notify.ts
src/lib/support-ai-agent.ts
src/app/api/contacts/route.ts
src/app/api/admin/support/tickets/*
src/app/api/webhooks/support-inbound/route.ts
src/app/(admin)/admin/support/*
workers/support-inbound/          # Cloudflare Email Worker
```
