import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createMemberSupportTicket,
  listMemberTickets,
  SupportTicketError,
} from "@/lib/support-tickets";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberId = parseInt(session.user.id, 10);
  if (!Number.isFinite(memberId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await listMemberTickets(memberId);
    return NextResponse.json({ tickets });
  } catch (e) {
    console.error("[member/support/tickets GET]", e);
    return NextResponse.json({ error: "Could not load tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberId = parseInt(session.user.id, 10);
  if (!Number.isFinite(memberId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      subject?: string;
      body?: string;
      category?: string;
      priority?: string;
    };
    const ticket = await createMemberSupportTicket({
      memberId,
      subject: body.subject || "",
      body: body.body || "",
      category: body.category,
      priority: body.priority,
    });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (e) {
    if (e instanceof SupportTicketError) {
      const status =
        e.code === "rate_limit" ? 429 : e.code === "validation" ? 400 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("[member/support/tickets POST]", e);
    return NextResponse.json({ error: "Could not create ticket" }, { status: 500 });
  }
}
