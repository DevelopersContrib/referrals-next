/**
 * @contrib/engagement
 *
 * Portable per-user engagement for VNOC domains.
 * - VNOC `leadmail_*` = campaign copy / templates (scoped by domain_id)
 * - App DB = enrollments + send log (default send unit = one user)
 * - SES (or inject sendEmail) for delivery
 *
 * Install: copy this folder, add path alias, wire a thin domain adapter.
 */

export { syncStepsFromVnoc } from "./sync";
export { enrollUser, cancelEnrollment } from "./enroll";
export { tickEnrollments } from "./tick";
export type { TickResult } from "./tick";
export { createSesSendEmail } from "./ses";
export type { SesAdapterOptions } from "./ses";
export { fetchVnocLeadmailSteps, createVnocConnection } from "./vnoc";
export { applyTokens, htmlToText } from "./tokens";
export type {
  EngagementConfig,
  EngagementEnrollment,
  EngagementStep,
  EngagementStore,
  EnrollmentStatus,
  FetchVnocStepsFn,
  LoadUserFn,
  SendEmailFn,
  ShouldSkipStepFn,
  UserEngagementProfile,
  VnocLeadmailStep,
} from "./types";
