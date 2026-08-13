export class SupportTicketError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "forbidden" | "validation" | "rate_limit"
  ) {
    super(message);
    this.name = "SupportTicketError";
  }
}

export const SUPPORT_CATEGORIES = [
  "billing",
  "campaigns",
  "account",
  "technical",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export function isCategory(v: string): v is SupportCategory {
  return (SUPPORT_CATEGORIES as readonly string[]).includes(v);
}

export const SUPPORT_STATUSES = [
  "open",
  "waiting_on_staff",
  "waiting_on_contractor",
  "resolved",
  "closed",
] as const;

export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export function isStatus(v: string): v is SupportStatus {
  return (SUPPORT_STATUSES as readonly string[]).includes(v);
}

export const AI_TURN_CAP = 3;

export const RF_SITE = "referrals";
