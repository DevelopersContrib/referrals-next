import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { ensureCampaignsForAllSegments, listCampaigns } from "@/lib/engagement-crud";

/** Bulk create can touch many segments — allow long-running serverless. */
export const maxDuration = 300;

/**
 * POST /api/admin/engagement/campaigns/ensure-all
 * Create branded template campaigns for every segment missing one.
 */
export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const result = await ensureCampaignsForAllSegments();
    const campaigns = await listCampaigns();
    return NextResponse.json({ ok: true, ...result, campaigns });
  } catch (e) {
    console.error("[panel/engagement/campaigns/ensure-all]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
