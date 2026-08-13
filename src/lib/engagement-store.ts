import { prisma } from "@/lib/prisma";
import type {
  EngagementEnrollment,
  EngagementStep,
  EngagementStore,
  EnrollmentStatus,
} from "@contrib/engagement";

function mapEnrollment(row: {
  id: number;
  domain_key: string;
  user_id: number;
  campaign_key: string;
  status: string;
  current_step: number;
  next_at: Date | null;
  context_json: string | null;
}): EngagementEnrollment {
  return {
    id: row.id,
    domainKey: row.domain_key,
    userId: row.user_id,
    campaignKey: row.campaign_key,
    status: row.status as EnrollmentStatus,
    currentStep: row.current_step,
    nextAt: row.next_at,
    contextJson: row.context_json,
  };
}

export const rfEngagementStore: EngagementStore = {
  async upsertSteps(steps) {
    let n = 0;
    for (const s of steps) {
      await prisma.engagement_steps.upsert({
        where: {
          domain_key_vnoc_mail_id: { domain_key: s.domainKey, vnoc_mail_id: s.vnocMailId },
        },
        create: {
          domain_key: s.domainKey,
          campaign_key: s.campaignKey,
          vnoc_mail_id: s.vnocMailId,
          step_order: s.stepOrder,
          delay_days: s.delayDays,
          subject: s.subject,
          body_html: s.bodyHtml,
          enabled: s.enabled,
          synced_at: new Date(),
        },
        update: {
          campaign_key: s.campaignKey,
          step_order: s.stepOrder,
          delay_days: s.delayDays,
          subject: s.subject,
          body_html: s.bodyHtml,
          enabled: s.enabled,
          synced_at: new Date(),
        },
      });
      n += 1;
    }
    return n;
  },

  async listSteps(domainKey, campaignKey): Promise<EngagementStep[]> {
    const rows = await prisma.engagement_steps.findMany({
      where: { domain_key: domainKey, campaign_key: campaignKey },
      orderBy: [{ step_order: "asc" }, { delay_days: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      domainKey: r.domain_key,
      campaignKey: r.campaign_key,
      vnocMailId: r.vnoc_mail_id,
      stepOrder: r.step_order,
      delayDays: r.delay_days,
      subject: r.subject,
      bodyHtml: r.body_html,
      enabled: Boolean(r.enabled),
    }));
  },

  async getEnrollment(domainKey, userId, campaignKey) {
    const row = await prisma.engagement_enrollments.findUnique({
      where: {
        domain_key_user_id_campaign_key: {
          domain_key: domainKey,
          user_id: userId,
          campaign_key: campaignKey,
        },
      },
    });
    return row ? mapEnrollment(row) : null;
  },

  async upsertEnrollment(input) {
    const row = await prisma.engagement_enrollments.upsert({
      where: {
        domain_key_user_id_campaign_key: {
          domain_key: input.domainKey,
          user_id: input.userId,
          campaign_key: input.campaignKey,
        },
      },
      create: {
        domain_key: input.domainKey,
        user_id: input.userId,
        campaign_key: input.campaignKey,
        status: input.status,
        current_step: input.currentStep,
        next_at: input.nextAt,
        context_json: input.contextJson ?? null,
        completed_at: input.completedAt ?? null,
      },
      update: {
        status: input.status,
        current_step: input.currentStep,
        next_at: input.nextAt,
        context_json: input.contextJson ?? null,
        completed_at: input.completedAt ?? null,
      },
    });
    return mapEnrollment(row);
  },

  async updateEnrollment(id, patch) {
    await prisma.engagement_enrollments.update({
      where: { id },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.currentStep !== undefined ? { current_step: patch.currentStep } : {}),
        ...(patch.nextAt !== undefined ? { next_at: patch.nextAt } : {}),
        ...(patch.contextJson !== undefined ? { context_json: patch.contextJson } : {}),
        ...(patch.completedAt !== undefined ? { completed_at: patch.completedAt } : {}),
      },
    });
  },

  async listDueEnrollments(domainKey, campaignKey, limit) {
    const rows = await prisma.engagement_enrollments.findMany({
      where: {
        domain_key: domainKey,
        campaign_key: campaignKey,
        status: "active",
        next_at: { lte: new Date() },
      },
      orderBy: { next_at: "asc" },
      take: limit,
    });
    return rows.map(mapEnrollment);
  },

  async hasSend(enrollmentId, stepOrder) {
    const row = await prisma.engagement_sends.findUnique({
      where: { enrollment_id_step_order: { enrollment_id: enrollmentId, step_order: stepOrder } },
    });
    return Boolean(row && (row.status === "sent" || row.status === "skipped"));
  },

  async tryClaimSend(input) {
    const existing = await prisma.engagement_sends.findUnique({
      where: {
        enrollment_id_step_order: {
          enrollment_id: input.enrollmentId,
          step_order: input.stepOrder,
        },
      },
    });
    if (existing) {
      if (existing.status === "sent" || existing.status === "skipped") return false;
      if (existing.status === "sending") return false;
      await prisma.engagement_sends.update({
        where: { id: existing.id },
        data: {
          status: "sending",
          error: null,
          vnoc_mail_id: input.vnocMailId,
          sent_at: new Date(),
        },
      });
      return true;
    }
    try {
      await prisma.engagement_sends.create({
        data: {
          enrollment_id: input.enrollmentId,
          step_order: input.stepOrder,
          vnoc_mail_id: input.vnocMailId,
          status: "sending",
        },
      });
      return true;
    } catch {
      return false;
    }
  },

  async recordSend(input) {
    await prisma.engagement_sends.upsert({
      where: {
        enrollment_id_step_order: {
          enrollment_id: input.enrollmentId,
          step_order: input.stepOrder,
        },
      },
      create: {
        enrollment_id: input.enrollmentId,
        step_order: input.stepOrder,
        vnoc_mail_id: input.vnocMailId,
        status: input.status,
        error: input.error ?? null,
      },
      update: {
        vnoc_mail_id: input.vnocMailId,
        status: input.status,
        error: input.error ?? null,
        sent_at: new Date(),
      },
    });
  },

  async lastSendAtForUser(domainKey, userId) {
    const row = await prisma.engagement_sends.findFirst({
      where: {
        status: "sent",
        enrollment: { domain_key: domainKey, user_id: userId },
      },
      orderBy: { sent_at: "desc" },
      select: { sent_at: true },
    });
    return row?.sent_at ?? null;
  },

  async countByStatus(domainKey, campaignKey) {
    const rows = await prisma.engagement_enrollments.findMany({
      where: { domain_key: domainKey, campaign_key: campaignKey },
      select: { status: true },
    });
    const out: Record<string, number> = {};
    for (const r of rows) out[r.status] = (out[r.status] || 0) + 1;
    return out;
  },

  async lastSyncedAt(domainKey, campaignKey) {
    const row = await prisma.engagement_steps.findFirst({
      where: { domain_key: domainKey, campaign_key: campaignKey },
      orderBy: { synced_at: "desc" },
      select: { synced_at: true },
    });
    return row?.synced_at ?? null;
  },
};

/** Alias so copied Handyman API routes keep working. */
export const hyEngagementStore = rfEngagementStore;
