import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { sendRfSupportAutoresponder } from "@/lib/support-autoresponder";

export const runtime = "nodejs";

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** POST /api/admin/engagement/autoresponder-test — smoke send contact auto-reply. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const sessionEmail = auth.user.email?.trim() || "";
  const email = String(body.email ?? sessionEmail).trim();
  const name = String(body.name ?? "Admin").trim() || "Admin";
  const subject = String(body.subject ?? "Support autoresponder test").trim();

  if (!email || !looksLikeEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  if (process.env.SUPPORT_AUTORESPONDER !== "1") {
    return NextResponse.json(
      { error: "Set SUPPORT_AUTORESPONDER=1 to enable contact auto-reply." },
      { status: 400 }
    );
  }

  try {
    await sendRfSupportAutoresponder({
      name,
      email,
      subject,
      message: "Admin UI test of the Referrals support autoresponder.",
      reference: `admin-test-${Date.now()}`,
    });
    return NextResponse.json({ ok: true, to: email });
  } catch (e) {
    console.error("[panel/engagement/autoresponder-test]", e);
    return NextResponse.json({ error: "Send failed. Check SES logs." }, { status: 500 });
  }
}
