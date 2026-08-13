import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { countBulkEnrollEligible, enrollExistingHyContractors } from "@/lib/engagement";
import {
  formatEnrollSuccessMessage,
  normalizeEnrollLimit,
  normalizeSpreadDays,
  validateLargeAudienceConfirm,
} from "@/lib/engagement-enroll-guards";

/** GET /api/admin/engagement/enroll-bulk — eligible count for confirm dialog. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const freeOnly = request.nextUrl.searchParams.get("freeOnly") !== "0";
  const eligible = await countBulkEnrollEligible(freeOnly);
  return NextResponse.json({ ok: true, eligible, freeOnly });
}

/**
 * POST /api/admin/engagement/enroll-bulk
 * Enroll a batch of existing contractors into the welcome campaign (staggered sends).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    limit?: number;
    freeOnly?: boolean;
    spreadDays?: number;
    confirmEnroll?: string;
  };

  const freeOnly = body.freeOnly !== false;
  const limit = normalizeEnrollLimit(body.limit);
  const spreadDays = normalizeSpreadDays(body.spreadDays);

  try {
    const eligible = await countBulkEnrollEligible(freeOnly);
    const confirmErr = validateLargeAudienceConfirm(eligible, body.confirmEnroll);
    if (confirmErr) {
      return NextResponse.json({ ok: false, error: confirmErr }, { status: 400 });
    }

    const result = await enrollExistingHyContractors({
      limit,
      freeOnly,
      spreadDays,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      eligible,
      message: formatEnrollSuccessMessage(result),
    });
  } catch (e) {
    console.error("[admin/engagement/enroll-bulk]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Bulk enroll failed" },
      { status: 500 }
    );
  }
}
