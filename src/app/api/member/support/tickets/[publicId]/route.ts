import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  addMemberReply,
  escalateTicketByMember,
  getMemberTicket,
  markTicketResolvedByMember,
  SupportTicketError,
} from "@/lib/support-tickets";

type Ctx = { params: Promise<{ publicId: string }> };

async function requireMemberId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const memberId = parseInt(session.user.id, 10);
  return Number.isFinite(memberId) ? memberId : null;
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const memberId = await requireMemberId();
  if (memberId == null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { publicId } = await ctx.params;

  try {
    const ticket = await getMemberTicket(memberId, publicId);
    return NextResponse.json({ ticket });
  } catch (e) {
    if (e instanceof SupportTicketError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.code === "not_found" ? 404 : 400 }
      );
    }
    console.error("[member/support/tickets GET id]", e);
    return NextResponse.json({ error: "Could not load ticket" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const memberId = await requireMemberId();
  if (memberId == null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { publicId } = await ctx.params;

  try {
    const body = (await request.json()) as { action?: string; body?: string };

    if (body.action === "resolve") {
      const ticket = await markTicketResolvedByMember(memberId, publicId);
      return NextResponse.json({ ticket });
    }
    if (body.action === "escalate") {
      const ticket = await escalateTicketByMember(memberId, publicId);
      return NextResponse.json({ ticket });
    }

    const ticket = await addMemberReply({
      memberId,
      publicId,
      body: body.body || "",
    });
    return NextResponse.json({ ticket });
  } catch (e) {
    if (e instanceof SupportTicketError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.code === "not_found" ? 404 : 400 }
      );
    }
    console.error("[member/support/tickets POST id]", e);
    return NextResponse.json({ error: "Could not update ticket" }, { status: 500 });
  }
}
