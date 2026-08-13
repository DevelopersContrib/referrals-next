import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { createCampaignFromSegment, listCampaigns } from "@/lib/engagement-crud";

/**
 * POST /api/admin/engagement/campaigns/from-segment
 * Create a campaign for a segment (AI drafts emails by default).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    segmentKey?: string;
    name?: string;
    description?: string;
    draftEmails?: boolean;
  };

  if (!body.segmentKey?.trim()) {
    return NextResponse.json({ ok: false, error: "segmentKey is required" }, { status: 400 });
  }

  try {
    const result = await createCampaignFromSegment({
      segmentKey: body.segmentKey.trim(),
      name: body.name,
      description: body.description,
      draftEmails: body.draftEmails !== false,
    });
    const campaigns = await listCampaigns();
    return NextResponse.json({
      ok: true,
      campaignKey: result.campaign.campaign_key,
      emailsCreated: result.emailsCreated,
      ai: result.ai,
      campaigns,
    });
  } catch (e) {
    console.error("[admin/engagement/campaigns/from-segment]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 }
    );
  }
}
