import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { tickHyEngagement } from "@/lib/engagement";

/** POST /api/admin/engagement/tick — process due enrollments (admin smoke). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(20, Math.max(1, Number(body.limit || 5)));
  const result = await tickHyEngagement(limit);
  return NextResponse.json({ ok: true, ...result });
}
