# @contrib/engagement

Portable **per-user engagement campaigns** for VNOC domains (HomeManager, Handyman, …).

- **VNOC** owns campaign copy (`leadmail` / `leadmail_campaigns`), scoped by `domains=<domain_id>`
- **Each domain app** owns enrollments + send log + SES delivery
- Default send unit = **one user** (not a segment blast)
- AI segment suggestions stay in the host admin UI (suggest-only)

## Install

```bash
cp -R modules/engagement /path/to/other-domain/modules/engagement
```

Path alias:

```json
"@contrib/engagement": ["./modules/engagement/src/index.ts"]
```

Env:

| Var | Purpose |
|---|---|
| `VNOC_DATABASE_URL` | Readonly MySQL to VNOC (`domaindi_managedomain`) |
| `ENGAGEMENT_VNOC_CAMPAIGN_ID` | `leadmail_campaigns.campaign_id` |
| `ENGAGEMENT_VNOC_DOMAIN_ID` | e.g. HomeManager `39710` |
| `ENGAGEMENT_ENABLED` | Set `0` to disable |
| `SES_FROM_EMAIL` / `SES_REGION` | Send path — or use Resend via `@contrib/mail` |

Apply engagement + support tables on **your app database** (MySQL or PostgreSQL). See `modules/PORTABLE-DATABASE.md` and:

- MySQL: `scripts/migrations/001_engagement_support.sql`
- PostgreSQL: `scripts/migrations/001_engagement_support.postgres.sql`

Tables include `domain_key` for multi-app sharing on one database.

Implement **`EngagementStore`** with your ORM (Prisma, Drizzle, Kysely, raw SQL) — the module does not import Prisma or assume MySQL for the app DB.  
(`VNOC_DATABASE_URL` for leadmail sync remains MySQL; that is separate from your app DB.)

## Core API

```ts
import {
  syncStepsFromVnoc,
  enrollUser,
  tickEnrollments,
  createVnocConnection,
  fetchVnocLeadmailSteps,
} from "@contrib/engagement";
import { createAppSendEmail } from "@contrib/mail";

await tickEnrollments(config, store, loadUser, createAppSendEmail(), shouldSkipStep);
```

Inject your `EngagementStore`, `loadUser`, and optional `shouldSkipStep` (e.g. skip Plus CTA if already Plus).

**Store examples:** Handyman (Prisma + MySQL), Developers.Contrib (Drizzle + MySQL). Postgres apps use the same interface — swap SQL/ORM in the adapter only.
