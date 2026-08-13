import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { getHyEngagementBrowse } from "@/lib/engagement";

/** GET /api/admin/engagement/browse — campaigns, emails, people, recent sends. */
export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const data = await getHyEngagementBrowse();
  return NextResponse.json({ ok: true, ...data });
}
