import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { createCampaign, listCampaigns } from "@/lib/engagement-crud";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const campaigns = await listCampaigns();
  return NextResponse.json({ ok: true, campaigns });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    key?: string;
    segmentKey?: string | null;
  };
  try {
    const campaign = await createCampaign({
      name: String(body.name || ""),
      description: body.description,
      key: body.key,
      segmentKey: body.segmentKey,
    });
    return NextResponse.json({ ok: true, campaign });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 }
    );
  }
}
