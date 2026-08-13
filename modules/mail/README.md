# @contrib/mail

Portable outbound email for `@contrib/*` modules and domain apps.

**Two providers — pick one via env:**

| Provider | When | Required env |
|----------|------|----------------|
| **Resend** | `EMAIL_PROVIDER=resend` or `RESEND_API_KEY` set (default when key present) | `RESEND_API_KEY` |
| **AWS SES** | `EMAIL_PROVIDER=ses` or no Resend key | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SES_REGION` |

Force SES while keeping a Resend key for rollback: `EMAIL_PROVIDER=ses`.

## Install

```bash
cp -R modules/mail /path/to/other-domain/modules/mail
pnpm add resend @aws-sdk/client-ses   # both optional at runtime; install what you use
```

Path alias:

```json
"@contrib/mail": ["./modules/mail/src/index.ts"]
```

## Usage

```ts
import { createAppSendEmail, emailConfigured, emailProvider } from "@contrib/mail";

void sendSupportAutoresponder(config, input, createAppSendEmail());
```

Supports `fromName`, `replyTo`, and `listUnsubscribeUrl` (RFC 8058) on both providers.
