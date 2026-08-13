import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { draftStaffSupportReply } from "@/lib/support-ai-agent";
import { getPanelTicket, SupportTicketError } from "@/lib/support-tickets";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const id = Number((await ctx.params).id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await req.json()) as { hint?: string };
    const ticket = await getPanelTicket(id);
    const result = await draftStaffSupportReply({
      subject: ticket.subject,
      publicId: ticket.public_id,
      status: ticket.status,
      staffHint: body.hint,
      requesterName: ticket.requester_name,
      messages: ticket.messages.map((m) => ({
        author_type: m.author_type,
        body: m.body,
        is_internal: m.is_internal,
      })),
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SupportTicketError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    const msg = e instanceof Error ? e.message : "Draft failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
