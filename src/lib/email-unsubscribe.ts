/**
 * Lightweight unsubscribe URL helpers for engagement emails.
 * Full preference center can be wired later; tokens remain stable.
 */
import { createHmac } from "node:crypto";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.referrals.com"
  ).replace(/\/$/, "");
}

function secret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || "referrals-dev";
}

function sign(memberId: number, email: string): string {
  const payload = `${memberId}:${email.trim().toLowerCase()}`;
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function buildUnsubscribePageUrl(memberId: number, email: string): string {
  const t = encodeURIComponent(sign(memberId, email));
  return `${siteUrl()}/unsubscribe?m=${memberId}&e=${encodeURIComponent(email.trim())}&t=${t}`;
}

export function buildOneClickUnsubscribeUrl(memberId: number, email: string): string {
  const t = encodeURIComponent(sign(memberId, email));
  return `${siteUrl()}/api/unsubscribe?m=${memberId}&e=${encodeURIComponent(email.trim())}&t=${t}`;
}
