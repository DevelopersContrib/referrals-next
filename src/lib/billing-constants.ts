/** Shared billing constants — safe for client + server imports (no Prisma). */
export const TRIAL_DAYS = 14;
export const FREE_DOMAIN_CAP = 1;
export const FREE_PARTICIPANT_CAP = 500;
export const DEFAULT_PAID_PLAN_ID = 2;
export const TRIAL_PLAN_ID = 1;

/** Existing `plans` rows sold on /pricing and /billing. */
export const PUBLIC_SALE_PLAN_IDS = [2, 6, 4, 5] as const;
export const BRAND_MONTHLY_PLAN_ID = 2;
export const BRAND_YEARLY_PLAN_ID = 6;
export const AGENCY_10_PLAN_ID = 4;
export const AGENCY_50_PLAN_ID = 5;
export const UNLIMITED_PLAN_ID = 3;

export const PLAN_PUBLIC_NAME: Record<number, string> = {
  2: "Brand, monthly",
  6: "Brand, yearly",
  4: "Agency 10",
  5: "Agency 50",
  3: "Premium Unlimited",
};
