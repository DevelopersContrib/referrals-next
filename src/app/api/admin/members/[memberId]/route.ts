import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";

type RouteParams = { params: Promise<{ memberId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const { memberId } = await params;
    const id = parseInt(memberId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });

    const member = await prisma.members.findUnique({ where: { id } });
    if (!member)
      return NextResponse.json({ error: "Member not found" }, { status: 404 });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const { memberId } = await params;
    const id = parseInt(memberId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });

    const existing = await prisma.members.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const body = await req.json();
    const { name, email, password, plan_id, is_verified, is_partner, is_admin } =
      body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (password) data.password = hashSync(password, 10);
    if (plan_id !== undefined) data.plan_id = parseInt(plan_id, 10);
    if (is_verified !== undefined) data.is_verified = is_verified;
    if (is_partner !== undefined) data.is_partner = is_partner;
    if (is_admin !== undefined) data.is_admin = Boolean(is_admin);

    const updated = await prisma.members.update({ where: { id }, data });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const { memberId } = await params;
    const id = parseInt(memberId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });

    await prisma.members.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
