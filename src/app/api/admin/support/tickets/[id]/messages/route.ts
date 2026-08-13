import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import {
  addStaffMessage,
  resolveStaffDisplayName,
  SupportTicketError,
} from "@/lib/support-tickets";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
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

  const session = await import("@/lib/auth").then((m) => m.auth());
  const user = session?.user as { name?: string | null; email?: string | null };

  try {
    const body = (await req.json()) as { body?: string; is_internal?: boolean };
    const staffName = await resolveStaffDisplayName({
      adminId: gate.memberId,
      email: user?.email,
      name: user?.name,
    });
    const ticket = await addStaffMessage({
      ticketId: id,
      adminId: gate.memberId,
      body: body.body || "",
      isInternal: Boolean(body.is_internal),
      staffName,
    });
    return NextResponse.json({ ticket });
  } catch (e) {
    if (e instanceof SupportTicketError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.code === "not_found" ? 404 : 400 }
      );
    }
    return NextResponse.json({ error: "Could not post message" }, { status: 500 });
  }
}
