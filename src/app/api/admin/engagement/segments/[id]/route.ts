import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { deleteSegment } from "@/lib/engagement-segments";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    await deleteSegment(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 }
    );
  }
}
