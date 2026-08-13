import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { createEmail } from "@/lib/engagement-crud";

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => ({}))) as {
    campaignKey?: string;
    subject?: string;
    bodyHtml?: string;
    delayDays?: number;
    enabled?: boolean;
  };
  try {
    const email = await createEmail({
      campaignKey: String(body.campaignKey || ""),
      subject: String(body.subject || ""),
      bodyHtml: body.bodyHtml,
      delayDays: body.delayDays,
      enabled: body.enabled,
    });
    return NextResponse.json({ ok: true, email });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 }
    );
  }
}
