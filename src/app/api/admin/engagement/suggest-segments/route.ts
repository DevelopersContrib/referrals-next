import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { prisma } from "@/lib/prisma";
import { completeText, aiEnabled } from "@/lib/ai";

/**
 * POST /api/admin/engagement/suggest-segments
 * Suggest-only (does not persist). Prefer POST /segments for AI create.
 */
export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const [freeRows, paidRows, recent] = await Promise.all([
    prisma.$queryRawUnsafe<{ c: bigint }[]>(`
      SELECT COUNT(*) AS c FROM members m
      WHERE m.plan_id IS NULL OR m.plan_id <= 1 OR m.plan_expiry IS NULL OR m.plan_expiry < NOW()
    `),
    prisma.$queryRawUnsafe<{ c: bigint }[]>(`
      SELECT COUNT(*) AS c FROM members m
      WHERE m.plan_id > 1 AND (m.plan_expiry IS NULL OR m.plan_expiry > NOW())
    `),
    prisma.members.findMany({
      orderBy: { date_signedup: "desc" },
      take: 40,
      select: { id: true, date_signedup: true, plan_id: true },
    }),
  ]);

  const free = Number(freeRows[0]?.c ?? 0);
  const paid = Number(paidRows[0]?.c ?? 0);
  const withCampaigns = await prisma.member_campaigns.groupBy({
    by: ["member_id"],
    where: { member_id: { in: recent.map((r) => r.id) } },
  });
  const campaignSet = new Set(withCampaigns.map((p) => p.member_id));

  const snapshot = {
    freeMembers: free,
    paidMembers: paid,
    recentSample: recent.map((r) => ({
      plan: r.plan_id && r.plan_id > 1 ? "paid" : "free",
      hasCampaign: campaignSet.has(r.id),
      daysAgo: Math.floor((Date.now() - r.date_signedup.getTime()) / 86400000),
    })),
  };

  const fallback = [
    {
      name: "Free · no campaigns",
      rationale: "Activation priority — never launched a campaign.",
      rules: { plan: "free", hasQuotes: false },
    },
    {
      name: "Paid members",
      rationale: "Paying members — quieter, higher-signal emails.",
      rules: { plan: "paid" },
    },
    {
      name: "New members (7 days)",
      rationale: "Onboard while signup momentum is high.",
      rules: { registeredWithinDays: 7 },
    },
  ];

  if (!aiEnabled()) {
    return NextResponse.json({ ok: true, suggestions: fallback, ai: false, snapshot });
  }

  const prompt = `You suggest email engagement segments for Referrals.com (referral marketing). Do NOT write email copy. Suggest 3-5 segments for personal 1:1 campaigns (not blasts).

Stats: ${JSON.stringify(snapshot)}

Return JSON array: [{"name":"...","rationale":"...","rules":{"plan":"free"|"paid"|"any","hasQuotes"?:boolean,"registeredWithinDays"?:number}}]
hasQuotes means has created a referral campaign.`;

  const text = await completeText(prompt, {
    maxTokens: 700,
    system: "Output JSON array only.",
  });

  if (!text) {
    return NextResponse.json({ ok: true, suggestions: fallback, ai: false, snapshot });
  }

  try {
    const json = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const suggestions = JSON.parse(json);
    return NextResponse.json({
      ok: true,
      suggestions: Array.isArray(suggestions) ? suggestions : fallback,
      ai: true,
      snapshot,
    });
  } catch {
    return NextResponse.json({ ok: true, suggestions: fallback, ai: false, snapshot });
  }
}
