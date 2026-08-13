# Portable database guide — @contrib modules

Other platforms may use **MySQL**, **PostgreSQL**, or a different ORM. The modules are designed so **only thin adapters touch the database**.

---

## What is database-agnostic

| Layer | DB required? | Notes |
|-------|--------------|--------|
| `@contrib/support-autoresponder` | **No** | Inject `sendEmail` only |
| `@contrib/engagement` (core) | **Via interface** | Implement `EngagementStore` — no Prisma/Drizzle inside the module |
| Support inbox (app pattern) | **Yes** | Not a npm module yet; copy schema + ticket helpers per app |

**Mail** is swappable via `@contrib/mail`: **AWS SES** or **Resend** (`EMAIL_PROVIDER=ses|resend`). See `modules/mail/README.md`.

---

## Engagement: the only required adapter

The module never imports an ORM. You implement `EngagementStore` from `@contrib/engagement`:

```ts
export type EngagementStore = {
  upsertSteps(steps): Promise<number>;
  listSteps(domainKey, campaignKey): Promise<EngagementStep[]>;
  getEnrollment(domainKey, userId, campaignKey): Promise<EngagementEnrollment | null>;
  upsertEnrollment(input): Promise<EngagementEnrollment>;
  updateEnrollment(id, patch): Promise<void>;
  listDueEnrollments(domainKey, campaignKey, limit): Promise<EngagementEnrollment[]>;
  hasSend(enrollmentId, stepOrder): Promise<boolean>;
  tryClaimSend?(input): Promise<boolean>;  // recommended for concurrent crons
  recordSend(input): Promise<void>;
  lastSendAtForUser(domainKey, userId): Promise<Date | null>;
  countByStatus(domainKey, campaignKey): Promise<Record<string, number>>;
  lastSyncedAt(domainKey, campaignKey): Promise<Date | null>;
};
```

### Reference implementations

| App | ORM | DB | Store file |
|-----|-----|-----|------------|
| Handyman / HomeManager | Prisma | MySQL (shared RDS) | `src/lib/engagement-store.ts` |
| Developers.Contrib | Drizzle | MySQL | `src/lib/engagement-store.ts` |
| *Your app* | Prisma / Drizzle / Kysely / raw SQL | MySQL **or** Postgres | copy pattern, swap queries |

Table/column names are conventional (`snake_case` in SQL). Map to your ORM models; the module only sees the TypeScript interface.

### Multi-app on one database

Use **`domain_key`** (e.g. `handyman`, `homemanager`, `developerscontrib`) on every engagement row.  
Use **`site`** on support tickets. Never list another brand’s rows in admin UI.

---

## Schema: pick your engine

Additive migrations live in `scripts/migrations/`:

| File | Engine |
|------|--------|
| `001_engagement_support.sql` | **MySQL** 8+ |
| `001_engagement_support.postgres.sql` | **PostgreSQL** 14+ |

Same logical tables:

- `support_tickets`, `support_ticket_messages`
- `engagement_steps`, `engagement_enrollments`, `engagement_sends`

Run **one** file matching your app DB — not both.

### MySQL

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  < scripts/migrations/001_engagement_support.sql
```

### PostgreSQL

```bash
psql "$DATABASE_URL" -f scripts/migrations/001_engagement_support.postgres.sql
```

Or translate into Prisma `schema.prisma` / Drizzle `schema.ts` — keep unique keys:

- `(domain_key, vnoc_mail_id)` on steps
- `(domain_key, user_id, campaign_key)` on enrollments
- `(enrollment_id, step_order)` on sends
- `public_id` unique on tickets

---

## VNOC sync connection (separate from app DB)

`VNOC_DATABASE_URL` is **always MySQL** (VNOC `leadmail` tables). That does not constrain your app database — Postgres apps still sync copy from VNOC MySQL, then store steps in local Postgres via `EngagementStore`.

---

## Support tickets: app-level, engine-specific

Ticket creation (`createContactFormTicket`, inbound ingest) lives in **your app**, not in `@contrib/support-autoresponder`. When porting:

1. Apply support tables (MySQL or Postgres migration)
2. Implement allocate public id (`HM-`, `DC-`, etc.) + insert ticket + first message
3. Call `sendSupportAutoresponder` after accept
4. Filter admin lists by `site` / `domain_key`

---

## Checklist for a new platform

1. Copy `modules/support-autoresponder` + `modules/engagement`
2. Choose app DB: MySQL **or** Postgres → run matching migration
3. Implement `EngagementStore` with your ORM
4. Implement `loadUser(userId)` for your user table
5. Inject mail: SES or SMTP or other `SendEmailFn`
6. Wire contact → ticket (optional) + autoresponder
7. Crons: `engagement-sync` + `engagement-tick` with `CRON_SECRET`
8. Set unique `domain_key` and ticket `site` for isolation
