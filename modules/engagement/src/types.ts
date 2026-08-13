export type EngagementConfig = {
  domainKey: string;
  domainId: number;
  siteName: string;
  siteUrl: string;
  campaignKey: string;
  vnocCampaignId: number;
  fromEmail: string;
  fromName?: string;
  replyToEmail?: string;
  /** Cap nurture sends per user across campaigns. */
  minDaysBetweenSends?: number;
  enabled?: boolean;
};

export type EngagementStep = {
  id?: number;
  domainKey: string;
  campaignKey: string;
  vnocMailId: number;
  stepOrder: number;
  delayDays: number;
  subject: string;
  bodyHtml: string | null;
  enabled: boolean;
};

export type EnrollmentStatus = "active" | "paused" | "completed" | "cancelled";

export type EngagementEnrollment = {
  id: number;
  domainKey: string;
  userId: number;
  campaignKey: string;
  status: EnrollmentStatus;
  currentStep: number;
  nextAt: Date | null;
  contextJson: string | null;
};

export type UserEngagementProfile = {
  userId: number;
  email: string;
  firstname: string;
  plan: string | null;
  projectCount: number;
  /** When false, skip all nurture sends. */
  allowWelcome: boolean;
  /**
   * Transactional signup welcome already delivered — skip campaign step 0
   * when it would duplicate that welcome email.
   */
  hasTransactionalWelcome?: boolean;
  tokens?: Record<string, string>;
};

export type VnocLeadmailStep = {
  mailId: number;
  subject: string;
  bodyHtml: string | null;
  delayDays: number;
  enabled: boolean;
  domains: string | null;
};

export type SendEmailArgs = {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** RFC 8058 one-click POST URL for List-Unsubscribe headers. */
  listUnsubscribeUrl?: string;
  /** Human-readable unsubscribe page linked from the footer. */
  unsubscribePageUrl?: string;
};

export type SendEmailFn = (args: SendEmailArgs) => Promise<void>;

export type EngagementStore = {
  upsertSteps: (steps: EngagementStep[]) => Promise<number>;
  listSteps: (domainKey: string, campaignKey: string) => Promise<EngagementStep[]>;
  getEnrollment: (
    domainKey: string,
    userId: number,
    campaignKey: string
  ) => Promise<EngagementEnrollment | null>;
  upsertEnrollment: (input: {
    domainKey: string;
    userId: number;
    campaignKey: string;
    status: EnrollmentStatus;
    currentStep: number;
    nextAt: Date | null;
    contextJson?: string | null;
    completedAt?: Date | null;
  }) => Promise<EngagementEnrollment>;
  updateEnrollment: (
    id: number,
    patch: Partial<{
      status: EnrollmentStatus;
      currentStep: number;
      nextAt: Date | null;
      contextJson: string | null;
      completedAt: Date | null;
    }>
  ) => Promise<void>;
  listDueEnrollments: (domainKey: string, campaignKey: string, limit: number) => Promise<EngagementEnrollment[]>;
  hasSend: (enrollmentId: number, stepOrder: number) => Promise<boolean>;
  /**
   * Atomically claim a step before sending (prevents concurrent cron double-sends).
   * Returns false if this step was already sent or is already claimed.
   */
  tryClaimSend?: (input: {
    enrollmentId: number;
    stepOrder: number;
    vnocMailId: number | null;
  }) => Promise<boolean>;
  recordSend: (input: {
    enrollmentId: number;
    stepOrder: number;
    vnocMailId: number | null;
    status: string;
    error?: string | null;
  }) => Promise<void>;
  lastSendAtForUser: (domainKey: string, userId: number) => Promise<Date | null>;
  countByStatus: (domainKey: string, campaignKey: string) => Promise<Record<string, number>>;
  lastSyncedAt: (domainKey: string, campaignKey: string) => Promise<Date | null>;
};

export type LoadUserFn = (userId: number) => Promise<UserEngagementProfile | null>;

export type FetchVnocStepsFn = (campaignId: number, domainId: number) => Promise<VnocLeadmailStep[]>;

/** Return true to skip this step (advance without send). */
export type ShouldSkipStepFn = (
  step: EngagementStep,
  user: UserEngagementProfile,
  enrollment: EngagementEnrollment
) => boolean;
