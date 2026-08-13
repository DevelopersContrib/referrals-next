import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { deleteEmail, updateEmail } from "@/lib/engagement-crud";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    subject?: string;
    bodyHtml?: string;
    delayDays?: number;
    stepOrder?: number;
    enabled?: boolean;
  };
  try {
    const email = await updateEmail(id, body);
    return NextResponse.json({ ok: true, email });
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
    await deleteEmail(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 }
    );
  }
}
