import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { deleteCampaign, updateCampaign } from "@/lib/engagement-crud";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    enabled?: boolean;
    segmentKey?: string | null;
  };
  try {
    const campaign = await updateCampaign(id, {
      name: body.name,
      description: body.description,
      enabled: body.enabled,
      segmentKey: body.segmentKey,
    });
    return NextResponse.json({ ok: true, campaign });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteCampaign(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 }
    );
  }
}
