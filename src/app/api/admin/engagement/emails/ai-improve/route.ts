import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { prisma } from "@/lib/prisma";
import { aiImproveActivationEmails } from "@/lib/engagement-email-templates";
import { listCampaigns } from "@/lib/engagement-crud";
import { aiEnabled } from "@/lib/ai";

export const maxDuration = 300;

/**
 * POST /api/admin/engagement/emails/ai-improve
 * AI rewrites the early contractor_activation emails (branded + logo).
 */
export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const result = await aiImproveActivationEmails(prisma);
    const campaigns = await listCampaigns();
    return NextResponse.json({
      ok: true,
      ...result,
      aiConfigured: aiEnabled(),
      campaigns,
    });
  } catch (e) {
    console.error("[panel/engagement/emails/ai-improve]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "AI improve failed" },
      { status: 500 }
    );
  }
}
