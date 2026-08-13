import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { prisma } from "@/lib/prisma";
import { applyWelcomeEmailTemplates } from "@/lib/engagement-email-templates";
import { listCampaigns } from "@/lib/engagement-crud";

/**
 * POST /api/admin/engagement/emails/apply-templates
 * Load editable starter templates onto the welcome campaign emails.
 */
export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const updated = await applyWelcomeEmailTemplates(prisma);
    const campaigns = await listCampaigns();
    return NextResponse.json({ ok: true, updated, campaigns });
  } catch (e) {
    console.error("[admin/engagement/emails/apply-templates]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
