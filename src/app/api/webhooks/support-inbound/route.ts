import { NextRequest, NextResponse } from "next/server";
import { ingestInboundSupportEmail } from "@/lib/support-email-tickets";

export const runtime = "nodejs";

/** POST /api/webhooks/support-inbound — Cloudflare Email Worker → support inbox */
export async function POST(request: NextRequest) {
  const secret = process.env.SUPPORT_INBOUND_WEBHOOK_SECRET || "";
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    fromEmail?: string;
    fromName?: string;
    subject?: string;
    textBody?: string;
    htmlBody?: string;
  } | null;

  if (!body?.fromEmail || !body.subject) {
    return NextResponse.json(
      { error: "fromEmail and subject are required" },
      { status: 400 }
    );
  }

  try {
    const result = await ingestInboundSupportEmail({
      fromEmail: body.fromEmail,
      fromName: body.fromName,
      subject: body.subject,
      textBody: body.textBody,
      htmlBody: body.htmlBody,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[webhooks/support-inbound]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Ingest failed" },
      { status: 500 }
    );
  }
}
