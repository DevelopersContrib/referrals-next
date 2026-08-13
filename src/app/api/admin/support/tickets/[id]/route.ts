import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard, requirePlatformAdminApi } from "@/lib/require-platform-admin";
import {
  getPanelTicket,
  updatePanelTicket,
  SupportTicketError,
} from "@/lib/support-tickets";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const id = Number((await ctx.params).id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const ticket = await getPanelTicket(id);
    return NextResponse.json({ ticket });
  } catch (e) {
    if (e instanceof SupportTicketError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not load ticket" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requirePlatformAdminApi();
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: gate.status }
    );
  }

  const id = Number((await ctx.params).id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await req.json()) as {
      status?: string;
      priority?: string;
      assignSelf?: boolean;
      unassign?: boolean;
    };
    const ticket = await updatePanelTicket(id, {
      status: body.status,
      priority: body.priority,
      assigned_admin_id: body.assignSelf
        ? gate.memberId
        : body.unassign
          ? null
          : undefined,
    });
    return NextResponse.json({ ticket });
  } catch (e) {
    if (e instanceof SupportTicketError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not update ticket" }, { status: 500 });
  }
}
