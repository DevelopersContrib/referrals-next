import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { syncHyEngagementSteps } from "@/lib/engagement";

/** POST /api/admin/engagement/sync — admin pull from VNOC. */
export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const result = await syncHyEngagementSteps();
  if (result.ok === false) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, upserted: result.upserted });
}
