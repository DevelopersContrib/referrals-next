/**
 * Referrals adapter for @contrib/engagement (Emails & AI).
 * `user_id` in engagement tables = members.id
 */
import {
  buildOneClickUnsubscribeUrl,
  buildUnsubscribePageUrl,
} from "@/lib/email-unsubscribe";
import { rfEngagementStore } from "@/lib/engagement-store";
import {
  normalizeEnrollLimit,
  normalizeSpreadDays,
} from "@/lib/engagement-enroll-guards";
import { sendAppEmail, rfDefaultFromEmail } from "@/lib/mail-send";
import { prisma } from "@/lib/prisma";
import {
  cancelEnrollment,
  applyTokens,
  createVnocConnection,
  enrollUser,
  fetchVnocLeadmailSteps,
  htmlToText,
  syncStepsFromVnoc,
  tickEnrollments,
  type EngagementConfig,
  type TickResult,
  type UserEngagementProfile,
} from "@contrib/engagement";

export const RF_ENGAGEMENT_CAMPAIGN = "member_activation";
export const RF_DOMAIN_KEY = "referrals";
export const RF_VNOC_DOMAIN_ID = Number(process.env.VNOC_DOMAIN_ID || 971);

/** Handyman-compatible aliases used by copied API routes / CRUD. */
export const HY_ENGAGEMENT_CAMPAIGN = RF_ENGAGEMENT_CAMPAIGN;
export const HY_DOMAIN_KEY = RF_DOMAIN_KEY;
export const HY_VNOC_DOMAIN_ID = RF_VNOC_DOMAIN_ID;

export function rfEngagementConfig(): EngagementConfig {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.referrals.com"
  ).replace(/\/$/, "");
  return {
    domainKey: RF_DOMAIN_KEY,
    domainId: Number(process.env.ENGAGEMENT_VNOC_DOMAIN_ID || RF_VNOC_DOMAIN_ID),
    siteName: process.env.ENGAGEMENT_SITE_NAME || "Referrals",
    siteUrl,
    campaignKey: RF_ENGAGEMENT_CAMPAIGN,
    vnocCampaignId: Number(process.env.ENGAGEMENT_VNOC_CAMPAIGN_ID || 0),
    fromEmail: rfDefaultFromEmail(),
    fromName: "Referrals.com",
    replyToEmail: process.env.CONTACT_EMAIL || process.env.SUPPORT_FROM_EMAIL || undefined,
    minDaysBetweenSends: 3,
    enabled: process.env.ENGAGEMENT_ENABLED !== "0",
  };
}

export const hyEngagementConfig = rfEngagementConfig;

export function engagementConfigured(): boolean {
  const c = rfEngagementConfig();
  return Boolean(c.enabled && c.fromEmail && (c.vnocCampaignId || true));
}

async function loadUser(userId: number): Promise<UserEngagementProfile | null> {
  const member = await prisma.members.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan_id: true,
      plan_expiry: true,
    },
  });
  if (!member?.email?.trim()) return null;

  const campaignCount = await prisma.member_campaigns
    .count({ where: { member_id: userId } })
    .catch(() => 0);

  const firstname = (member.name || "").trim().split(/\s+/)[0] || "there";
  const email = member.email.trim();
  const paid =
    Boolean(member.plan_id && member.plan_id > 1) &&
    (member.plan_expiry == null || member.plan_expiry.getTime() > Date.now());

  return {
    userId: member.id,
    email,
    firstname,
    plan: paid ? "paid" : "free",
    projectCount: campaignCount,
    allowWelcome: true,
    hasTransactionalWelcome: false,
    tokens: {
      unsubscribePageUrl: buildUnsubscribePageUrl(member.id, email),
      listUnsubscribeUrl: buildOneClickUnsubscribeUrl(member.id, email),
    },
  };
}

function shouldSkipStep(
  step: { delayDays: number; subject: string; stepOrder: number },
  user: UserEngagementProfile,
  enrollment?: { campaignKey: string }
): boolean {
  if (
    enrollment?.campaignKey === RF_ENGAGEMENT_CAMPAIGN &&
    step.stepOrder === 0 &&
    user.hasTransactionalWelcome
  ) {
    return true;
  }

  const subj = step.subject.toLowerCase();
  const isPaid = (user.plan || "").toLowerCase() === "paid";

  if (isPaid && (subj.includes("upgrade") || subj.includes("pricing") || subj.includes("plan"))) {
    return true;
  }
  if (user.projectCount > 0 && (subj.includes("first campaign") || step.delayDays === 2)) {
    return true;
  }
  return false;
}

export async function syncRfEngagementSteps() {
  const config = rfEngagementConfig();
  const url = process.env.VNOC_DATABASE_URL;
  if (!url) return { ok: false as const, error: "VNOC_DATABASE_URL not set" };
  if (!config.vnocCampaignId) {
    return { ok: false as const, error: "ENGAGEMENT_VNOC_CAMPAIGN_ID not set" };
  }

  const conn = await createVnocConnection(url);
  try {
    return await syncStepsFromVnoc(config, rfEngagementStore, (campaignId, domainId) =>
      fetchVnocLeadmailSteps(conn, campaignId, domainId)
    );
  } finally {
    await conn.end();
  }
}

export const syncHyEngagementSteps = syncRfEngagementSteps;

export async function enrollRfMemberActivation(memberId: number) {
  const config = rfEngagementConfig();
  return enrollUser(config, rfEngagementStore, memberId, { source: "signup" });
}

export const enrollHyContractorActivation = enrollRfMemberActivation;

export function queueRfMemberActivation(memberId: number) {
  void enrollRfMemberActivation(memberId).then((r) => {
    if (r.ok === false) console.error("[engagement] enroll failed", memberId, r.error);
  });
}

export async function countBulkEnrollEligible(freeOnly = true): Promise<number> {
  const config = rfEngagementConfig();
  const freeClause = freeOnly
    ? `AND (m.plan_id IS NULL OR m.plan_id <= 1 OR m.plan_expiry IS NULL OR m.plan_expiry < NOW())`
    : "";
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(`
    SELECT COUNT(*) AS c
    FROM members m
    WHERE m.email IS NOT NULL AND TRIM(m.email) <> ''
      ${freeClause}
      AND NOT EXISTS (
        SELECT 1 FROM engagement_enrollments e
        WHERE e.user_id = m.id
          AND e.domain_key = '${config.domainKey}'
          AND e.campaign_key = '${config.campaignKey}'
          AND e.status IN ('active', 'completed')
      )
  `);
  return Number(rows[0]?.c ?? 0);
}

export async function enrollExistingRfMembers(opts?: {
  limit?: number;
  freeOnly?: boolean;
  spreadDays?: number;
}): Promise<{ enrolled: number; remainingEstimate: number; spreadDays: number }> {
  const config = rfEngagementConfig();
  const limit = normalizeEnrollLimit(opts?.limit);
  const spreadDays = normalizeSpreadDays(opts?.spreadDays);
  const freeOnly = opts?.freeOnly !== false;
  const freeClause = freeOnly
    ? `AND (m.plan_id IS NULL OR m.plan_id <= 1 OR m.plan_expiry IS NULL OR m.plan_expiry < NOW())`
    : "";

  const candidates = await prisma.$queryRawUnsafe<{ id: number }[]>(`
    SELECT m.id
    FROM members m
    WHERE m.email IS NOT NULL AND TRIM(m.email) <> ''
      ${freeClause}
      AND NOT EXISTS (
        SELECT 1 FROM engagement_enrollments e
        WHERE e.user_id = m.id
          AND e.domain_key = '${config.domainKey}'
          AND e.campaign_key = '${config.campaignKey}'
          AND e.status IN ('active', 'completed')
      )
    ORDER BY m.date_signedup DESC
    LIMIT ${limit}
  `);

  const spreadMs = spreadDays * 86400000;
  let enrolled = 0;
  for (let i = 0; i < candidates.length; i++) {
    const userId = candidates[i].id;
    const nextAt = new Date(
      Date.now() + (candidates.length <= 1 ? 0 : (i / (candidates.length - 1)) * spreadMs)
    );
    try {
      await rfEngagementStore.upsertEnrollment({
        domainKey: config.domainKey,
        userId,
        campaignKey: config.campaignKey,
        status: "active",
        currentStep: 0,
        nextAt,
        contextJson: JSON.stringify({ source: "bulk" }),
      });
      enrolled += 1;
    } catch (e) {
      console.error("[engagement] bulk enroll", userId, e);
    }
  }

  const remainingEstimate = Math.max(0, (await countBulkEnrollEligible(freeOnly)) - enrolled);
  return { enrolled, remainingEstimate, spreadDays };
}

export const enrollExistingHyContractors = enrollExistingRfMembers;

export async function cancelRfMemberActivation(memberId: number) {
  await cancelEnrollment(rfEngagementConfig(), rfEngagementStore, memberId);
}

export const cancelHyContractorActivation = cancelRfMemberActivation;

export async function sendEngagementEmailTest(opts: {
  stepId: number;
  to: string;
  firstname?: string;
  contractorId?: number;
  memberId?: number;
}): Promise<{ to: string; subject: string; from: string }> {
  const config = rfEngagementConfig();
  if (!config.fromEmail) throw new Error("Missing from email (CONTACT_EMAIL / SUPPORT_FROM_EMAIL)");

  const step = await prisma.engagement_steps.findUnique({ where: { id: opts.stepId } });
  if (!step || step.domain_key !== config.domainKey) throw new Error("Email template not found");

  const memberId = opts.memberId ?? opts.contractorId;
  const unsubscribePageUrl =
    memberId != null ? buildUnsubscribePageUrl(memberId, opts.to) : undefined;
  const listUnsubscribeUrl =
    memberId != null ? buildOneClickUnsubscribeUrl(memberId, opts.to) : undefined;

  const tokens: Record<string, string> = {
    firstname: (opts.firstname || "there").trim() || "there",
    domain: config.siteName,
    siteName: config.siteName,
    siteUrl: config.siteUrl,
  };
  const subject = `[TEST] ${applyTokens(step.subject, tokens)}`;
  let html = applyTokens(step.body_html || `<p>${subject}</p>`, tokens);
  let text = htmlToText(html);
  if (unsubscribePageUrl) {
    html += `
<div style="padding:16px 24px;border-top:1px solid #e7e5e4;font-size:12px;color:#a8a29e;margin-top:24px;">
  <a href="${unsubscribePageUrl}" style="color:#78716c;text-decoration:none;">Unsubscribe</a>
  from product tips &amp; onboarding emails.
</div>`;
    text += `\n\nUnsubscribe: ${unsubscribePageUrl}\n`;
  }

  await sendAppEmail({
    from: config.fromEmail,
    fromName: config.fromName || config.siteName,
    to: opts.to,
    subject,
    html,
    text,
    replyTo: config.replyToEmail,
    listUnsubscribeUrl,
  });

  return { to: opts.to, subject, from: config.fromEmail };
}

export async function tickRfEngagement(limit = 50): Promise<TickResult> {
  const config = rfEngagementConfig();
  const empty: TickResult = { processed: 0, sent: 0, skipped: 0, completed: 0, errors: 0 };
  if (!config.fromEmail) return empty;

  const [campaignRows, stepKeys] = await Promise.all([
    prisma.engagement_campaigns.findMany({
      where: { domain_key: config.domainKey, enabled: true },
      select: { campaign_key: true },
    }),
    prisma.engagement_steps.findMany({
      where: { domain_key: config.domainKey, enabled: true },
      distinct: ["campaign_key"],
      select: { campaign_key: true },
    }),
  ]);
  const keys = Array.from(
    new Set([
      config.campaignKey,
      ...campaignRows.map((c) => c.campaign_key),
      ...stepKeys.map((s) => s.campaign_key),
    ])
  );

  const totals: TickResult = { ...empty };
  let remaining = Math.min(200, Math.max(1, limit));

  for (const campaignKey of keys) {
    if (remaining <= 0) break;
    const r = await tickEnrollments(
      { ...config, campaignKey },
      rfEngagementStore,
      loadUser,
      sendAppEmail,
      shouldSkipStep,
      { limit: remaining }
    );
    totals.processed += r.processed;
    totals.sent += r.sent;
    totals.skipped += r.skipped;
    totals.completed += r.completed;
    totals.errors += r.errors;
    remaining -= r.processed;
  }
  return totals;
}

export const tickHyEngagement = tickRfEngagement;

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function autoEnrollEnabledSegmentCampaigns(opts?: {
  maxSegmentMembers?: number;
  limitPerCampaign?: number;
  largeDailyCap?: number;
  spreadDays?: number;
}): Promise<{
  campaigns: {
    campaignKey: string;
    segmentKey: string;
    members: number;
    enrolled: number;
    remainingEstimate: number;
    mode?: "small" | "large_drip";
    enrolledToday?: number;
    skipped?: string;
  }[];
  enrolledTotal: number;
}> {
  const config = rfEngagementConfig();
  if (config.enabled === false) {
    return { campaigns: [], enrolledTotal: 0 };
  }

  const maxSegmentMembers = Math.min(5000, Math.max(1, opts?.maxSegmentMembers ?? 100));
  const limitPerCampaign = Math.min(200, Math.max(1, opts?.limitPerCampaign ?? 50));
  const largeDailyCap = Math.min(200, Math.max(1, opts?.largeDailyCap ?? 30));
  const spreadDaysSmall = opts?.spreadDays ?? 7;

  const { parseRulesFromJson, countSegmentMembers } = await import("@/lib/engagement-segments");

  const campaigns = await prisma.engagement_campaigns.findMany({
    where: {
      domain_key: config.domainKey,
      enabled: true,
      segment_key: { not: null },
    },
    orderBy: { id: "asc" },
  });

  const results: {
    campaignKey: string;
    segmentKey: string;
    members: number;
    enrolled: number;
    remainingEstimate: number;
    mode?: "small" | "large_drip";
    enrolledToday?: number;
    skipped?: string;
  }[] = [];
  let enrolledTotal = 0;
  const dayStart = startOfUtcDay();

  for (const camp of campaigns) {
    const segmentKey = (camp.segment_key || "").trim();
    if (!segmentKey) continue;

    const seg = await prisma.engagement_segments.findFirst({
      where: { domain_key: config.domainKey, segment_key: segmentKey, enabled: true },
    });
    if (!seg) {
      results.push({
        campaignKey: camp.campaign_key,
        segmentKey,
        members: 0,
        enrolled: 0,
        remainingEstimate: 0,
        skipped: "segment missing/disabled",
      });
      continue;
    }

    const rules = parseRulesFromJson(seg.rules_json);
    const members = await countSegmentMembers(rules);

    if (members <= maxSegmentMembers) {
      const r = await enrollSegmentIntoCampaign({
        campaignKey: camp.campaign_key,
        segmentKey,
        limit: limitPerCampaign,
        spreadDays: spreadDaysSmall,
      });
      enrolledTotal += r.enrolled;
      results.push({
        campaignKey: camp.campaign_key,
        segmentKey,
        members,
        enrolled: r.enrolled,
        remainingEstimate: r.remainingEstimate,
        mode: "small",
      });
      continue;
    }

    const enrolledToday = await prisma.engagement_enrollments.count({
      where: {
        domain_key: config.domainKey,
        campaign_key: camp.campaign_key,
        enrolled_at: { gte: dayStart },
      },
    });
    const room = Math.max(0, largeDailyCap - enrolledToday);
    if (room <= 0) {
      results.push({
        campaignKey: camp.campaign_key,
        segmentKey,
        members,
        enrolled: 0,
        remainingEstimate: members,
        mode: "large_drip",
        enrolledToday,
        skipped: `daily cap ${largeDailyCap} already reached`,
      });
      continue;
    }

    const r = await enrollSegmentIntoCampaign({
      campaignKey: camp.campaign_key,
      segmentKey,
      limit: room,
      spreadDays: 1,
    });
    enrolledTotal += r.enrolled;
    results.push({
      campaignKey: camp.campaign_key,
      segmentKey,
      members,
      enrolled: r.enrolled,
      remainingEstimate: r.remainingEstimate,
      mode: "large_drip",
      enrolledToday: enrolledToday + r.enrolled,
    });
  }

  return { campaigns: results, enrolledTotal };
}

export async function enrollSegmentIntoCampaign(opts: {
  campaignKey: string;
  segmentKey?: string;
  limit?: number;
  spreadDays?: number;
}): Promise<{ enrolled: number; remainingEstimate: number; spreadDays: number; segmentKey: string }> {
  const config = rfEngagementConfig();
  if (config.enabled === false) {
    return { enrolled: 0, remainingEstimate: 0, spreadDays: 0, segmentKey: "" };
  }

  const campaign = await prisma.engagement_campaigns.findUnique({
    where: {
      domain_key_campaign_key: {
        domain_key: config.domainKey,
        campaign_key: opts.campaignKey,
      },
    },
  });
  if (!campaign) throw new Error("Campaign not found");

  const segmentKey = (opts.segmentKey || campaign.segment_key || "").trim();
  if (!segmentKey) throw new Error("Campaign has no segment — pick a segment first");

  const { getSegmentByKey, parseRulesFromJson, listSegmentMemberIds, countSegmentMembers } =
    await import("@/lib/engagement-segments");
  const seg = await getSegmentByKey(segmentKey);
  if (!seg) throw new Error("Segment not found");
  const rules = parseRulesFromJson(seg.rules_json);

  const limit = normalizeEnrollLimit(opts.limit);
  const spreadDays = normalizeSpreadDays(opts.spreadDays);
  const candidates = await listSegmentMemberIds(rules, {
    limit,
    excludeCampaignKey: campaign.campaign_key,
  });

  const spreadMs = spreadDays * 86400000;
  let enrolled = 0;
  for (let i = 0; i < candidates.length; i++) {
    const userId = candidates[i];
    const nextAt = new Date(
      Date.now() + (candidates.length <= 1 ? 0 : (i / (candidates.length - 1)) * spreadMs)
    );
    try {
      await rfEngagementStore.upsertEnrollment({
        domainKey: config.domainKey,
        userId,
        campaignKey: campaign.campaign_key,
        status: "active",
        currentStep: 0,
        nextAt,
        contextJson: JSON.stringify({ source: "segment", segmentKey }),
      });
      enrolled += 1;
    } catch (e) {
      console.error("[engagement] segment enroll", userId, e);
    }
  }

  const totalMatching = await countSegmentMembers(rules);
  const already = await prisma.engagement_enrollments.count({
    where: {
      domain_key: config.domainKey,
      campaign_key: campaign.campaign_key,
    },
  });
  const remainingEstimate = Math.max(0, totalMatching - already);

  return { enrolled, remainingEstimate, spreadDays, segmentKey };
}

export async function getRfEngagementStatus() {
  const config = rfEngagementConfig();
  const [counts, lastSynced, stepCount] = await Promise.all([
    rfEngagementStore.countByStatus(config.domainKey, config.campaignKey),
    rfEngagementStore.lastSyncedAt(config.domainKey, config.campaignKey),
    prisma.engagement_steps.count({
      where: { domain_key: config.domainKey, campaign_key: config.campaignKey },
    }),
  ]);
  return {
    enabled: config.enabled !== false,
    configured: Boolean(config.enabled && config.fromEmail),
    domainKey: config.domainKey,
    domainId: config.domainId,
    campaignKey: config.campaignKey,
    vnocCampaignId: config.vnocCampaignId,
    stepCount,
    lastSyncedAt: lastSynced?.toISOString() ?? null,
    enrollments: counts,
    hasVnocUrl: Boolean(process.env.VNOC_DATABASE_URL),
    hasFromEmail: Boolean(config.fromEmail),
  };
}

export const getHyEngagementStatus = getRfEngagementStatus;

export async function getRfEngagementBrowse() {
  const config = rfEngagementConfig();
  const domainKey = config.domainKey;
  const { listCampaigns } = await import("@/lib/engagement-crud");

  const [campaigns, enrollments, recentSends, subscriberTotal, recentMembers] =
    await Promise.all([
      listCampaigns(domainKey),
      prisma.engagement_enrollments.findMany({
        where: { domain_key: domainKey },
        orderBy: { enrolled_at: "desc" },
        take: 200,
      }),
      prisma.engagement_sends.findMany({
        where: { enrollment: { domain_key: domainKey } },
        orderBy: { sent_at: "desc" },
        take: 40,
        include: {
          enrollment: { select: { user_id: true, campaign_key: true, status: true } },
        },
      }),
      prisma.members.count(),
      prisma.members.findMany({
        orderBy: { date_signedup: "desc" },
        take: 100,
        select: {
          id: true,
          email: true,
          name: true,
          plan_id: true,
          plan_expiry: true,
          date_signedup: true,
        },
      }),
    ]);

  const nameByKey = new Map(campaigns.map((c) => [c.key, c.name]));
  const enrollByUser = new Map<number, (typeof enrollments)[0]>();
  for (const e of enrollments) {
    if (!enrollByUser.has(e.user_id)) enrollByUser.set(e.user_id, e);
  }

  const people = recentMembers.map((m) => {
    const e = enrollByUser.get(m.id);
    const paid =
      Boolean(m.plan_id && m.plan_id > 1) &&
      (m.plan_expiry == null || m.plan_expiry.getTime() > Date.now());
    return {
      id: e?.id ?? m.id,
      userId: m.id,
      email: m.email,
      name: (m.name || "").trim() || "—",
      plan: paid ? "paid" : "free",
      campaignKey: e?.campaign_key ?? null,
      campaignName: e ? nameByKey.get(e.campaign_key) || e.campaign_key : null,
      status: e?.status ?? "subscriber",
      currentStep: e?.current_step ?? 0,
      nextAt: e?.next_at?.toISOString() ?? null,
      enrolledAt: (e?.enrolled_at ?? m.date_signedup).toISOString(),
    };
  });

  const sendUserIds = Array.from(new Set(recentSends.map((s) => s.enrollment.user_id)));
  const sendMembers = sendUserIds.length
    ? await prisma.members.findMany({
        where: { id: { in: sendUserIds } },
        select: { id: true, email: true },
      })
    : [];
  const sendById = new Map(sendMembers.map((m) => [m.id, m]));

  const sends = recentSends.map((s) => {
    const m = sendById.get(s.enrollment.user_id);
    return {
      id: s.id,
      email: m?.email || `user #${s.enrollment.user_id}`,
      campaignName: nameByKey.get(s.enrollment.campaign_key) || s.enrollment.campaign_key,
      stepOrder: s.step_order,
      status: s.status,
      sentAt: s.sent_at.toISOString(),
      error: s.error,
    };
  });

  const inSequence = await prisma.engagement_enrollments.count({
    where: { domain_key: domainKey, status: "active" },
  });

  return {
    campaigns,
    people,
    sends,
    subscriberTotal,
    inSequence,
  };
}

export const getHyEngagementBrowse = getRfEngagementBrowse;
