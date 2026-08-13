import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { aiCreateSegments, listSegments } from "@/lib/engagement-segments";

/** GET /api/admin/engagement/segments — list saved segments + live counts. */
export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const segments = await listSegments();
  return NextResponse.json({ ok: true, segments });
}

/** POST /api/admin/engagement/segments — AI creates/updates segments automatically. */
export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  try {
    const result = await aiCreateSegments();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[admin/engagement/segments]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "AI segment create failed" },
      { status: 500 }
    );
  }
}
