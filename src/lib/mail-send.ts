export {
  createAppSendEmail,
  emailConfigured,
  emailProvider,
  defaultFromEmail,
} from "@contrib/mail";

import { createAppSendEmail, defaultFromEmail as moduleDefaultFrom } from "@contrib/mail";

const RF_FROM_FALLBACK = "support@referrals.com";

export function rfDefaultFromEmail(): string {
  return (
    process.env.SUPPORT_FROM_EMAIL?.trim() ||
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.AWS_SES_FROM_EMAIL?.trim() ||
    moduleDefaultFrom(RF_FROM_FALLBACK)
  );
}

export const sendAppEmail = createAppSendEmail();
