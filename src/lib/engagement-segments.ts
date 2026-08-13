import { prisma } from "@/lib/prisma";
import { completeText, aiEnabled } from "@/lib/ai";
import { RF_DOMAIN_KEY, RF_ENGAGEMENT_CAMPAIGN } from "@/lib/engagement";

export type SegmentRules = {
  /** free | paid | any */
  plan?: "free" | "paid" | "any";
  /** Has at least one member_campaigns row (mapped from Handyman hasQuotes) */
  hasQuotes?: boolean;
  registeredWithinDays?: number;
  registeredBeforeDays?: number;
  inWelcomeSequence?: boolean;
  notInWelcomeSequence?: boolean;
};

export type SegmentRow = {
  id: number;
  key: string;
  name: string;
  description: string;
  rules: SegmentRules;
  source: string;
  enabled: boolean;
  memberCount: number;
  createdAt: string;
};

function slugKey(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 48) || `segment_${Date.now()}`
  );
}

export function parseRulesFromJson(raw: string): SegmentRules {
  try {
    return JSON.parse(raw) as SegmentRules;
  } catch {
    return {};
  }
}

function mysqlDatetime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function buildSegmentWhere(
  rules: SegmentRules,
  opts?: { excludeCampaignKey?: string }
): string {
  const now = Date.now();
  const clauses: string[] = ["m.email IS NOT NULL", "TRIM(m.email) <> ''"];

  if (rules.plan === "free") {
    clauses.push(
      "(m.plan_id IS NULL OR m.plan_id <= 1 OR m.plan_expiry IS NULL OR m.plan_expiry < NOW())"
    );
  } else if (rules.plan === "paid") {
    clauses.push("(m.plan_id > 1 AND (m.plan_expiry IS NULL OR m.plan_expiry > NOW()))");
  }

  if (typeof rules.registeredWithinDays === "number" && rules.registeredWithinDays > 0) {
    const days = Math.min(Math.floor(rules.registeredWithinDays), 3650);
    const d = new Date(now - days * 86400000);
    clauses.push(`m.date_signedup >= '${mysqlDatetime(d)}'`);
  }
  if (typeof rules.registeredBeforeDays === "number" && rules.registeredBeforeDays > 0) {
    const days = Math.min(Math.floor(rules.registeredBeforeDays), 3650);
    const d = new Date(now - days * 86400000);
    clauses.push(`m.date_signedup < '${mysqlDatetime(d)}'`);
  }

  if (rules.hasQuotes === true) {
    clauses.push("EXISTS (SELECT 1 FROM member_campaigns mc WHERE mc.member_id = m.id)");
  } else if (rules.hasQuotes === false) {
    clauses.push("NOT EXISTS (SELECT 1 FROM member_campaigns mc WHERE mc.member_id = m.id)");
  }

  if (rules.inWelcomeSequence === true) {
    clauses.push(
      `EXISTS (SELECT 1 FROM engagement_enrollments e WHERE e.user_id = m.id AND e.domain_key = '${RF_DOMAIN_KEY}' AND e.campaign_key = '${RF_ENGAGEMENT_CAMPAIGN}' AND e.status = 'active')`
    );
  }
  if (rules.notInWelcomeSequence === true) {
    clauses.push(
      `NOT EXISTS (SELECT 1 FROM engagement_enrollments e WHERE e.user_id = m.id AND e.domain_key = '${RF_DOMAIN_KEY}' AND e.campaign_key = '${RF_ENGAGEMENT_CAMPAIGN}')`
    );
  }

  if (opts?.excludeCampaignKey) {
    const ck = opts.excludeCampaignKey.replace(/[^a-zA-Z0-9_]/g, "");
    if (ck) {
      clauses.push(
        `NOT EXISTS (
          SELECT 1 FROM engagement_enrollments e2
          WHERE e2.user_id = m.id
            AND e2.domain_key = '${RF_DOMAIN_KEY}'
            AND e2.campaign_key = '${ck}'
            AND e2.status IN ('active', 'completed')
        )`
      );
    }
  }

  return clauses.join(" AND ");
}

export async function countSegmentMembers(rules: SegmentRules): Promise<number> {
  const sql = `SELECT COUNT(*) AS c FROM members m WHERE ${buildSegmentWhere(rules)}`;
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(sql);
  return Number(rows[0]?.c ?? 0);
}

export async function listSegmentMemberIds(
  rules: SegmentRules,
  opts?: { limit?: number; excludeCampaignKey?: string }
): Promise<number[]> {
  const limit = Math.min(500, Math.max(1, opts?.limit ?? 200));
  const sql = `
    SELECT m.id
    FROM members m
    WHERE ${buildSegmentWhere(rules, { excludeCampaignKey: opts?.excludeCampaignKey })}
    ORDER BY m.date_signedup DESC
    LIMIT ${limit}
  `;
  const rows = await prisma.$queryRawUnsafe<{ id: number }[]>(sql);
  return rows.map((r) => Number(r.id));
}

export async function getSegmentByKey(segmentKey: string) {
  return prisma.engagement_segments.findUnique({
    where: {
      domain_key_segment_key: { domain_key: RF_DOMAIN_KEY, segment_key: segmentKey },
    },
  });
}

export async function listSegments(domainKey = RF_DOMAIN_KEY): Promise<SegmentRow[]> {
  const rows = await prisma.engagement_segments.findMany({
    where: { domain_key: domainKey },
    orderBy: { updated_at: "desc" },
  });
  const out: SegmentRow[] = [];
  for (const r of rows) {
    const rules = parseRulesFromJson(r.rules_json);
    const memberCount = r.enabled ? await countSegmentMembers(rules) : 0;
    out.push({
      id: r.id,
      key: r.segment_key,
      name: r.name,
      description: r.description || "",
      rules,
      source: r.source,
      enabled: Boolean(r.enabled),
      memberCount,
      createdAt: r.created_at.toISOString(),
    });
  }
  return out;
}

export async function deleteSegment(id: number) {
  const row = await prisma.engagement_segments.findUnique({ where: { id } });
  if (!row || row.domain_key !== RF_DOMAIN_KEY) throw new Error("Segment not found");
  await prisma.engagement_segments.delete({ where: { id } });
}

const FALLBACK_SEGMENTS: { name: string; description: string; rules: SegmentRules }[] = [
  {
    name: "Free · no campaigns yet",
    description: "Free members who haven’t created a campaign — activation priority.",
    rules: { plan: "free", hasQuotes: false, notInWelcomeSequence: true },
  },
  {
    name: "Paid active",
    description: "Paying members with a current plan.",
    rules: { plan: "paid" },
  },
  {
    name: "New members (7 days)",
    description: "Recently registered member accounts.",
    rules: { registeredWithinDays: 7 },
  },
  {
    name: "New members (14 days)",
    description: "First two weeks — product tour window.",
    rules: { registeredWithinDays: 14, notInWelcomeSequence: true },
  },
  {
    name: "Free · has campaigns",
    description: "Free members already running campaigns — soft paid CTA.",
    rules: { plan: "free", hasQuotes: true },
  },
  {
    name: "Quiet free (30+ days, no campaigns)",
    description: "Signed up a month+ ago with no campaign — gentle nudge.",
    rules: { plan: "free", hasQuotes: false, registeredBeforeDays: 30 },
  },
  {
    name: "Quiet free (90+ days, no campaigns)",
    description: "Older free accounts with no campaigns — re-engagement.",
    rules: { plan: "free", hasQuotes: false, registeredBeforeDays: 90 },
  },
  {
    name: "In welcome sequence",
    description: "Members currently enrolled in the activation tour.",
    rules: { inWelcomeSequence: true },
  },
];

async function gatherStats() {
  const [free, paid, total, withCampaigns] = await Promise.all([
    prisma.$queryRawUnsafe<{ c: bigint }[]>(`
      SELECT COUNT(*) AS c FROM members m
      WHERE m.plan_id IS NULL OR m.plan_id <= 1 OR m.plan_expiry IS NULL OR m.plan_expiry < NOW()
    `),
    prisma.$queryRawUnsafe<{ c: bigint }[]>(`
      SELECT COUNT(*) AS c FROM members m
      WHERE m.plan_id > 1 AND (m.plan_expiry IS NULL OR m.plan_expiry > NOW())
    `),
    prisma.members.count(),
    prisma.$queryRawUnsafe<{ c: bigint }[]>(`
      SELECT COUNT(DISTINCT member_id) AS c FROM member_campaigns WHERE member_id IS NOT NULL
    `),
  ]);
  return {
    totalMembers: total,
    freeMembers: Number(free[0]?.c ?? 0),
    paidMembers: Number(paid[0]?.c ?? 0),
    membersWithCampaigns: Number(withCampaigns[0]?.c ?? 0),
  };
}

type AiSegment = { name: string; description: string; rules: SegmentRules };

export async function aiCreateSegments(): Promise<{
  created: number;
  updated: number;
  segments: SegmentRow[];
  ai: boolean;
}> {
  const stats = await gatherStats();
  let proposed: AiSegment[] = [];
  let usedAi = false;

  if (aiEnabled()) {
    const prompt = `You create audience SEGMENTS for Referrals.com (referral marketing SaaS). Personal 1:1 engagement — not blasts.

Live stats:
${JSON.stringify(stats, null, 2)}

Return ONLY a JSON array of 4-6 segments. Each must use this exact shape:
{
  "name": "short label",
  "description": "one sentence why this segment matters",
  "rules": {
    "plan": "free" | "paid" | "any",
    "hasQuotes": true | false | omit,
    "registeredWithinDays": number | omit,
    "registeredBeforeDays": number | omit,
    "inWelcomeSequence": true | omit,
    "notInWelcomeSequence": true | omit
  }
}

Note: hasQuotes means "has created at least one referral campaign" on this platform.
Rules must be realistic for activation, nurture, or paid upsell. Prefer free members without campaigns.`;

    const text = await completeText(prompt, {
      maxTokens: 900,
      system: "Lifecycle marketer. Output JSON array only. No markdown.",
    });
    if (text) {
      try {
        const json = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(json) as AiSegment[];
        if (Array.isArray(parsed) && parsed.length) {
          proposed = parsed.filter((s) => s?.name && s?.rules && typeof s.rules === "object");
          usedAi = proposed.length > 0;
        }
      } catch {
        proposed = [];
      }
    }
  }

  if (!proposed.length) proposed = FALLBACK_SEGMENTS;

  let created = 0;
  let updated = 0;
  for (const s of proposed) {
    const key = slugKey(s.name);
    const rules: SegmentRules = { ...(s.rules || {}) };
    if (!rules.plan) rules.plan = "free";
    const existing = await prisma.engagement_segments.findUnique({
      where: { domain_key_segment_key: { domain_key: RF_DOMAIN_KEY, segment_key: key } },
    });
    if (existing) {
      await prisma.engagement_segments.update({
        where: { id: existing.id },
        data: {
          name: s.name.slice(0, 200),
          description: (s.description || "").slice(0, 2000) || null,
          rules_json: JSON.stringify(rules),
          source: usedAi ? "ai" : "default",
          enabled: true,
        },
      });
      updated += 1;
    } else {
      await prisma.engagement_segments.create({
        data: {
          domain_key: RF_DOMAIN_KEY,
          segment_key: key,
          name: s.name.slice(0, 200),
          description: (s.description || "").slice(0, 2000) || null,
          rules_json: JSON.stringify(rules),
          source: usedAi ? "ai" : "default",
          enabled: true,
        },
      });
      created += 1;
    }
  }

  const segments = await listSegments();
  return { created, updated, segments, ai: usedAi };
}
