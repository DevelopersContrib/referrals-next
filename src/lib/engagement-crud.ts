import { prisma } from "@/lib/prisma";
import { HY_DOMAIN_KEY, RF_ENGAGEMENT_CAMPAIGN } from "@/lib/engagement";
import { completeText, aiEnabled } from "@/lib/ai";
import {
  buildBrandedEngagementEmail,
  ensureTenEmailsOnCampaign,
  segmentFlavorFromRules,
  tenEmailSequenceForSegment,
  ENGAGEMENT_EMAILS_PER_SEGMENT,
  applyWelcomeEmailTemplates,
} from "@/lib/engagement-email-templates";
import { getSegmentByKey, parseRulesFromJson, type SegmentRules } from "@/lib/engagement-segments";

function slugKey(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
  return base || `campaign_${Date.now()}`;
}

export async function listCampaigns(domainKey = HY_DOMAIN_KEY) {
  const [campaigns, steps, segments] = await Promise.all([
    prisma.engagement_campaigns.findMany({
      where: { domain_key: domainKey },
      orderBy: { updated_at: "desc" },
    }),
    prisma.engagement_steps.findMany({
      where: { domain_key: domainKey },
      orderBy: [{ campaign_key: "asc" }, { step_order: "asc" }],
    }),
    prisma.engagement_segments.findMany({
      where: { domain_key: domainKey },
      select: { segment_key: true, name: true },
    }),
  ]);

  const segmentNameByKey = new Map(segments.map((s) => [s.segment_key, s.name]));

  const keys = new Set(campaigns.map((c) => c.campaign_key));
  for (const s of steps) {
    if (!keys.has(s.campaign_key)) {
      keys.add(s.campaign_key);
      await prisma.engagement_campaigns.create({
        data: {
          domain_key: domainKey,
          campaign_key: s.campaign_key,
          name: s.campaign_key.replace(/_/g, " "),
          description: null,
          enabled: true,
        },
      });
    }
  }

  const fresh =
    keys.size === campaigns.length
      ? campaigns
      : await prisma.engagement_campaigns.findMany({
          where: { domain_key: domainKey },
          orderBy: { updated_at: "desc" },
        });

  return fresh.map((c) => {
    const emails = steps.filter((s) => s.campaign_key === c.campaign_key);
    const segmentKey = c.segment_key || null;
    return {
      id: c.id,
      key: c.campaign_key,
      name: c.name,
      blurb: c.description || "",
      enabled: Boolean(c.enabled),
      segmentKey,
      segmentName: segmentKey ? segmentNameByKey.get(segmentKey) || segmentKey : null,
      emailCount: emails.length,
      emails: emails.map((s) => ({
        id: s.id,
        stepOrder: s.step_order,
        delayDays: s.delay_days,
        subject: s.subject,
        bodyHtml: s.body_html,
        enabled: Boolean(s.enabled),
        when:
          s.delay_days <= 0
            ? "Right away"
            : s.delay_days === 1
              ? "Day 1"
              : `Day ${s.delay_days}`,
      })),
    };
  });
}

export async function createCampaign(input: {
  name: string;
  description?: string;
  key?: string;
  segmentKey?: string | null;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  let key = (input.key || slugKey(name)).trim();
  const exists = await prisma.engagement_campaigns.findUnique({
    where: { domain_key_campaign_key: { domain_key: HY_DOMAIN_KEY, campaign_key: key } },
  });
  if (exists) key = `${key}_${Date.now().toString(36).slice(-4)}`;

  let segmentKey = input.segmentKey?.trim() || null;
  if (segmentKey) {
    const seg = await getSegmentByKey(segmentKey);
    if (!seg) throw new Error("Segment not found");
  }

  return prisma.engagement_campaigns.create({
    data: {
      domain_key: HY_DOMAIN_KEY,
      campaign_key: key,
      name,
      description: input.description?.trim() || null,
      segment_key: segmentKey,
      enabled: true,
    },
  });
}

export async function updateCampaign(
  id: number,
  input: {
    name?: string;
    description?: string;
    enabled?: boolean;
    segmentKey?: string | null;
  }
) {
  if (input.segmentKey) {
    const seg = await getSegmentByKey(input.segmentKey);
    if (!seg) throw new Error("Segment not found");
  }
  return prisma.engagement_campaigns.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.segmentKey !== undefined ? { segment_key: input.segmentKey || null } : {}),
    },
  });
}

export async function deleteCampaign(id: number) {
  const camp = await prisma.engagement_campaigns.findUnique({ where: { id } });
  if (!camp) throw new Error("Campaign not found");
  if (camp.domain_key !== HY_DOMAIN_KEY) throw new Error("Wrong domain");

  await prisma.$transaction([
    prisma.engagement_steps.deleteMany({
      where: { domain_key: HY_DOMAIN_KEY, campaign_key: camp.campaign_key },
    }),
    prisma.engagement_enrollments.updateMany({
      where: { domain_key: HY_DOMAIN_KEY, campaign_key: camp.campaign_key, status: "active" },
      data: { status: "cancelled", next_at: null, completed_at: new Date() },
    }),
    prisma.engagement_campaigns.delete({ where: { id } }),
  ]);
}

/** Local-only mail ids use negative numbers so they never clash with VNOC mail_id. */
async function nextLocalMailId(): Promise<number> {
  const row = await prisma.engagement_steps.findFirst({
    where: { domain_key: HY_DOMAIN_KEY, vnoc_mail_id: { lt: 0 } },
    orderBy: { vnoc_mail_id: "asc" },
    select: { vnoc_mail_id: true },
  });
  const min = row?.vnoc_mail_id ?? 0;
  return min < 0 ? min - 1 : -1;
}

export async function createEmail(input: {
  campaignKey: string;
  subject: string;
  bodyHtml?: string;
  delayDays?: number;
  enabled?: boolean;
}) {
  const campaignKey = input.campaignKey.trim();
  const camp = await prisma.engagement_campaigns.findUnique({
    where: { domain_key_campaign_key: { domain_key: HY_DOMAIN_KEY, campaign_key: campaignKey } },
  });
  if (!camp) throw new Error("Campaign not found");

  const maxOrder = await prisma.engagement_steps.aggregate({
    where: { domain_key: HY_DOMAIN_KEY, campaign_key: campaignKey },
    _max: { step_order: true },
  });
  const stepOrder = (maxOrder._max.step_order ?? -1) + 1;
  const vnocMailId = await nextLocalMailId();

  return prisma.engagement_steps.create({
    data: {
      domain_key: HY_DOMAIN_KEY,
      campaign_key: campaignKey,
      vnoc_mail_id: vnocMailId,
      step_order: stepOrder,
      delay_days: Math.max(0, Number(input.delayDays ?? 0)),
      subject: input.subject.trim().slice(0, 200),
      body_html: input.bodyHtml?.trim() || null,
      enabled: input.enabled !== false,
      synced_at: new Date(),
    },
  });
}

export async function updateEmail(
  id: number,
  input: {
    subject?: string;
    bodyHtml?: string;
    delayDays?: number;
    stepOrder?: number;
    enabled?: boolean;
  }
) {
  const step = await prisma.engagement_steps.findUnique({ where: { id } });
  if (!step || step.domain_key !== HY_DOMAIN_KEY) throw new Error("Email not found");

  return prisma.engagement_steps.update({
    where: { id },
    data: {
      ...(input.subject !== undefined ? { subject: input.subject.trim().slice(0, 200) } : {}),
      ...(input.bodyHtml !== undefined ? { body_html: input.bodyHtml } : {}),
      ...(input.delayDays !== undefined ? { delay_days: Math.max(0, Number(input.delayDays)) } : {}),
      ...(input.stepOrder !== undefined ? { step_order: Math.max(0, Number(input.stepOrder)) } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      synced_at: new Date(),
    },
  });
}

export async function deleteEmail(id: number) {
  const step = await prisma.engagement_steps.findUnique({ where: { id } });
  if (!step || step.domain_key !== HY_DOMAIN_KEY) throw new Error("Email not found");
  await prisma.engagement_steps.delete({ where: { id } });
}

type DraftEmail = {
  subject: string;
  bodyHtml: string;
  delayDays: number;
  stepOrder?: number;
};

type InnerDraft = {
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
  delayDays: number;
  stepOrder?: number;
};

function wrapDrafts(drafts: InnerDraft[]): DraftEmail[] {
  return drafts.map((d, i) => ({
    subject: d.subject.slice(0, 200),
    delayDays: d.delayDays,
    stepOrder: d.stepOrder ?? i,
    bodyHtml: buildBrandedEngagementEmail({
      heading: d.heading,
      bodyHtml: d.bodyHtml,
      ctaLabel: d.ctaLabel,
      ctaHref: d.ctaHref,
    }),
  }));
}

/** Always 10 beautiful branded emails — editable anytime in Emails & AI. */
function defaultDraftsForSegment(segmentName: string, rules: SegmentRules): DraftEmail[] {
  const flavor = segmentFlavorFromRules(rules);
  return tenEmailSequenceForSegment(segmentName, flavor).map((t) => ({
    subject: t.subject,
    bodyHtml: t.bodyHtml,
    delayDays: t.delayDays,
    stepOrder: t.stepOrder,
  }));
}

async function aiDraftEmails(
  segmentName: string,
  description: string,
  rules: SegmentRules
): Promise<DraftEmail[] | null> {
  if (!aiEnabled()) return null;
  const prompt = `Write a 10-email personal engagement sequence for Referrals.com BRAND MANAGERS.

Segment: ${segmentName}
Description: ${description || "n/a"}
Rules: ${JSON.stringify(rules)}

Goal: get them to check out Referrals features (dashboard, brands, campaigns, widget studio, integrations, rewards/coupons, campaign emails, analytics, billing, support/account) relevant to THIS segment.
Tone: warm, practical, not spammy. Branded product tour — not a blast. Exactly ${ENGAGEMENT_EMAILS_PER_SEGMENT} emails.

Return ONLY a JSON array of exactly 10 objects:
[{
  "stepOrder": 0,
  "subject":"... use {{firstname}} when natural",
  "heading":"...",
  "bodyHtml":"<p style=\\"...\\">inner HTML only — NO logo/wrapper</p>",
  "ctaLabel":"Button →",
  "ctaHref":"{{siteUrl}}/...",
  "delayDays":0
}]

ctaHref allowlist:
{{siteUrl}}/dashboard, /brands, /stats, /billing, /account, /contact, /pricing, /support

delayDays must be: 0,1,2,3,5,7,9,11,14,17
stepOrder: 0..9`;

  const text = await completeText(prompt, {
    maxTokens: 4500,
    system: "Lifecycle email writer for Referrals.com brand managers. Output JSON array only. No markdown.",
  });
  if (!text) return null;
  try {
    const json = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(json) as InnerDraft[];
    if (!Array.isArray(parsed) || parsed.length < 10) return null;
    return wrapDrafts(
      parsed
        .filter((e) => e?.subject)
        .slice(0, ENGAGEMENT_EMAILS_PER_SEGMENT)
        .map((e, i) => ({
          subject: String(e.subject).slice(0, 200),
          heading: String(e.heading || `Hi {{firstname}}`),
          bodyHtml: String(e.bodyHtml || `<p>Hi {{firstname}},</p>`),
          ctaLabel: String(e.ctaLabel || "Open Referrals →"),
          ctaHref: String(e.ctaHref || "{{siteUrl}}/dashboard"),
          delayDays: Math.max(0, Number(e.delayDays ?? [0, 1, 2, 3, 5, 7, 9, 11, 14, 17][i])),
          stepOrder: Number(e.stepOrder ?? i),
        }))
    );
  } catch {
    return null;
  }
}

function campaignNameForSegment(segName: string): string {
  return `${segName}`.slice(0, 180);
}

/**
 * Create a campaign linked to a segment, optionally AI-drafting emails.
 */
export async function createCampaignFromSegment(input: {
  segmentKey: string;
  name?: string;
  description?: string;
  draftEmails?: boolean;
  /** When true (default), try AI drafts then fall back to branded templates. */
  useAi?: boolean;
}) {
  const seg = await getSegmentByKey(input.segmentKey);
  if (!seg || !seg.enabled) throw new Error("Segment not found");
  const rules = parseRulesFromJson(seg.rules_json);

  const campaign = await createCampaign({
    name: (input.name || campaignNameForSegment(seg.name)).slice(0, 200),
    description:
      input.description?.trim() ||
      seg.description ||
      `Beautiful branded sequence for segment “${seg.name}” — feature checkouts tailored to this audience.`,
    key: `seg_${seg.segment_key}`.slice(0, 64),
    segmentKey: seg.segment_key,
  });

  let emailsCreated = 0;
  let usedAi = false;
  if (input.draftEmails !== false) {
    // Prefer deterministic 10-email branded tour (always complete).
    // Optional AI path must still yield 10 or we fall back.
    let drafts = defaultDraftsForSegment(seg.name, rules);
    if (input.useAi === true) {
      const aiDrafts = await aiDraftEmails(seg.name, seg.description || "", rules);
      if (aiDrafts && aiDrafts.length >= ENGAGEMENT_EMAILS_PER_SEGMENT) {
        drafts = aiDrafts.slice(0, ENGAGEMENT_EMAILS_PER_SEGMENT);
        usedAi = true;
      }
    }
    for (const d of drafts) {
      await createEmail({
        campaignKey: campaign.campaign_key,
        subject: d.subject,
        bodyHtml: d.bodyHtml,
        delayDays: d.delayDays,
        enabled: true,
      });
      emailsCreated += 1;
    }
    // Safety: fill any missing step_orders to guarantee 10
    const fill = await ensureTenEmailsOnCampaign(prisma, campaign.campaign_key, {
      segmentName: seg.name,
      flavor: segmentFlavorFromRules(rules),
    });
    emailsCreated += fill.added;
  }

  return { campaign, emailsCreated, ai: usedAi };
}

/**
 * Create beautiful branded campaigns for every enabled segment (10 emails each).
 * Existing campaigns with fewer than 10 emails are backfilled (missing steps only —
 * edited copy is never overwritten). Also ensures member_activation has 10 emails.
 */
export async function ensureCampaignsForAllSegments(): Promise<{
  created: number;
  skipped: number;
  backfilled: number;
  results: {
    segmentKey: string;
    campaignKey: string;
    emailsCreated: number;
    ai: boolean;
    skipped?: boolean;
    backfilled?: number;
  }[];
}> {
  // Welcome / activation campaign always has the 10-email tour
  await applyWelcomeEmailTemplates(prisma, HY_DOMAIN_KEY, RF_ENGAGEMENT_CAMPAIGN);
  await prisma.engagement_campaigns.upsert({
    where: {
      domain_key_campaign_key: {
        domain_key: HY_DOMAIN_KEY,
        campaign_key: RF_ENGAGEMENT_CAMPAIGN,
      },
    },
    create: {
      domain_key: HY_DOMAIN_KEY,
      campaign_key: RF_ENGAGEMENT_CAMPAIGN,
      name: "Member activation",
      description: "10-email Referrals product tour — editable anytime.",
      enabled: true,
      segment_key: null,
    },
    update: {
      name: "Member activation",
      description: "10-email Referrals product tour — editable anytime.",
      enabled: true,
    },
  });

  const segments = await prisma.engagement_segments.findMany({
    where: { domain_key: HY_DOMAIN_KEY, enabled: true },
    orderBy: { id: "asc" },
  });
  const existing = await prisma.engagement_campaigns.findMany({
    where: { domain_key: HY_DOMAIN_KEY, segment_key: { not: null } },
    select: { segment_key: true, campaign_key: true },
  });
  const bySeg = new Map(existing.map((c) => [c.segment_key!, c.campaign_key]));

  const results: {
    segmentKey: string;
    campaignKey: string;
    emailsCreated: number;
    ai: boolean;
    skipped?: boolean;
    backfilled?: number;
  }[] = [];
  let created = 0;
  let skipped = 0;
  let backfilled = 0;

  for (const seg of segments) {
    const already = bySeg.get(seg.segment_key);
    if (already) {
      const rules = parseRulesFromJson(seg.rules_json);
      const fill = await ensureTenEmailsOnCampaign(prisma, already, {
        segmentName: seg.name,
        flavor: segmentFlavorFromRules(rules),
      });
      backfilled += fill.added;
      skipped += 1;
      results.push({
        segmentKey: seg.segment_key,
        campaignKey: already,
        emailsCreated: fill.total,
        ai: false,
        skipped: true,
        backfilled: fill.added,
      });
      continue;
    }
    const r = await createCampaignFromSegment({
      segmentKey: seg.segment_key,
      draftEmails: true,
      useAi: false,
    });
    created += 1;
    results.push({
      segmentKey: seg.segment_key,
      campaignKey: r.campaign.campaign_key,
      emailsCreated: r.emailsCreated,
      ai: r.ai,
    });
  }

  return { created, skipped, backfilled, results };
}
