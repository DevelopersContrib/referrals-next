/** Safe enroll defaults (S815-R8). */
export const ENGAGEMENT_ENROLL_DEFAULT_LIMIT = 25;
export const ENGAGEMENT_ENROLL_MAX_LIMIT = 200;
export const ENGAGEMENT_ENROLL_DEFAULT_SPREAD_DAYS = 7;
export const ENGAGEMENT_ENROLL_LARGE_SEGMENT_THRESHOLD = 100;
export const ENGAGEMENT_ENROLL_CONFIRM_TOKEN = "ENROLL";

export function normalizeEnrollLimit(limit?: number): number {
  if (limit == null || !Number.isFinite(limit)) {
    return ENGAGEMENT_ENROLL_DEFAULT_LIMIT;
  }
  return Math.min(ENGAGEMENT_ENROLL_MAX_LIMIT, Math.max(1, Math.floor(limit)));
}

export function normalizeSpreadDays(spreadDays?: number): number {
  if (spreadDays == null || !Number.isFinite(spreadDays)) {
    return ENGAGEMENT_ENROLL_DEFAULT_SPREAD_DAYS;
  }
  return Math.min(30, Math.max(1, Math.floor(spreadDays)));
}

export function validateLargeAudienceConfirm(
  memberCount: number,
  confirmEnroll?: string
): string | null {
  if (memberCount < ENGAGEMENT_ENROLL_LARGE_SEGMENT_THRESHOLD) return null;
  if (confirmEnroll?.trim() === ENGAGEMENT_ENROLL_CONFIRM_TOKEN) return null;
  return `This audience has ${memberCount.toLocaleString()} members. Type ${ENGAGEMENT_ENROLL_CONFIRM_TOKEN} to confirm enrollment.`;
}

export function formatEnrollSuccessMessage(opts: {
  enrolled: number;
  remainingEstimate: number;
  spreadDays: number;
}): string {
  const { enrolled, remainingEstimate, spreadDays } = opts;
  if (enrolled === 0) {
    return "Everyone in this audience is already enrolled.";
  }
  const remaining =
    remainingEstimate > 0
      ? ` ~${remainingEstimate.toLocaleString()} may still be left — enroll another batch if needed.`
      : "";
  return `Enrolled ${enrolled.toLocaleString()} people.${remaining} First emails spread over ${spreadDays} days — cron runs about every 15 minutes.`;
}
