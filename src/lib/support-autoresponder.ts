import {
  sendSupportAutoresponder,
  type SupportAutoresponderInput,
} from "@contrib/support-autoresponder";
import { sendAppEmail, rfDefaultFromEmail, emailConfigured } from "@/lib/mail-send";

function rfConfig() {
  const support = rfDefaultFromEmail();
  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://www.referrals.com"
  ).replace(/\/$/, "");

  return {
    siteName: process.env.SUPPORT_AUTORESPONDER_SITE_NAME || "Referrals.com",
    siteUrl,
    fromEmail: support,
    replyToEmail: support,
    supportEmail: support,
    enabled: process.env.SUPPORT_AUTORESPONDER !== "0" && emailConfigured(),
  };
}

export async function sendRfSupportAutoresponder(
  input: SupportAutoresponderInput
): Promise<void> {
  const r = await sendSupportAutoresponder(rfConfig(), input, sendAppEmail);
  if (r.ok === false) console.error("[support-autoresponder] rf failed", r.error);
}

export function queueSupportAutoresponder(input: SupportAutoresponderInput): void {
  void sendRfSupportAutoresponder(input);
}
