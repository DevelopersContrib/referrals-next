# @contrib/support-autoresponder

Portable **support ticket autoresponder** for any domain (HomeManager, Handyman, ServiceEscrow, etc.).

- No database / no new tables — works with **MySQL, Postgres, or no DB at all**
- Brand via config (`siteName`, `siteUrl`, emails)
- Default **AWS SES** adapter — or inject your own `sendEmail` (SMTP/nodemailer, Resend, …)
- Best-effort: never throws into your contact handler

## Install on a domain

### Option A — copy the module

```bash
cp -R modules/support-autoresponder /path/to/other-domain/modules/support-autoresponder
```

Add a path alias (example `tsconfig.json`):

```json
{
  "compilerOptions": {
    "paths": {
      "@contrib/support-autoresponder": ["./modules/support-autoresponder/src/index.ts"]
    }
  }
}
```

### Option B — later publish as private npm

Point `"@contrib/support-autoresponder"` at this package once you publish it to your registry. The API stays the same.

## Wire into contact / support create

```ts
import {
  sendSupportAutoresponder,
  createSesSendEmail,
} from "@contrib/support-autoresponder";

// After you accept the ticket / email ops:
void sendSupportAutoresponder(
  {
    siteName: "Handyman",
    siteUrl: "https://www.handyman.com",
    fromEmail: process.env.SES_FROM_EMAIL!,
    replyToEmail: process.env.CONTACT_EMAIL,
    supportEmail: process.env.CONTACT_EMAIL,
    enabled: process.env.SUPPORT_AUTORESPONDER !== "0",
  },
  { name, email, subject, message, reference: `hm-${ticketId}` },
  createSesSendEmail({ region: process.env.AWS_SES_REGION })
);
```

## Env (per domain)

| Var | Purpose |
|-----|---------|
| `SES_FROM_EMAIL` | From (verified in SES) |
| `CONTACT_EMAIL` | Reply-To / support line in body |
| `AWS_SES_REGION` or `AWS_REGION` | SES region (often separate from `S3_BUCKET_REGION`) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | SES credentials |
| `SUPPORT_AUTORESPONDER` | Set to `0` to disable without uninstalling |

## Custom mailer

```ts
await sendSupportAutoresponder(config, input, async ({ from, to, subject, text, html, replyTo }) => {
  // Resend, Postmark, Handyman mailer, etc.
});
```

## What it does **not** do

- Does not create support tables (use Handyman support store)
- Does not replace the ops inbox email — still send that separately
- Does not claim to be a full helpdesk
