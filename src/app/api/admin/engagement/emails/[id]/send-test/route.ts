import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { sendEngagementEmailTest } from "@/lib/engagement";

type Ctx = { params: Promise<{ id: string }> };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * POST /api/admin/engagement/emails/[id]/send-test
 * Send one campaign email template to an address (admin smoke — no enrollment).
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    firstname?: string;
  };
  const sessionUser = auth.user as { email?: string | null; name?: string | null };
  const email = normalizeEmail(body.email || sessionUser.email || "");
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  try {
    const result = await sendEngagementEmailTest({
      stepId: id,
      to: email,
      firstname: body.firstname || sessionUser.name?.split(/\s+/)[0] || "there",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[admin/engagement/emails/send-test]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Send failed" },
      { status: 500 }
    );
  }
}
