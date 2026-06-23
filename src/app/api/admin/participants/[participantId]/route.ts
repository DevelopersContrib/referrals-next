import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ participantId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const gate = await requirePlatformAdminApi();
  if (!gate.ok)
    return NextResponse.json(
      { error: gate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: gate.status }
    );
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { participantId } = await params;
    const id = parseInt(participantId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid participant ID" },
        { status: 400 }
      );

    const participant = await prisma.campaign_participants.findUnique({
      where: { id },
    });
    if (!participant)
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );

    return NextResponse.json(participant);
  } catch (error) {
    console.error("Error fetching participant:", error);
    return NextResponse.json(
      { error: "Failed to fetch participant" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const gate = await requirePlatformAdminApi();
  if (!gate.ok)
    return NextResponse.json(
      { error: gate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: gate.status }
    );
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { participantId } = await params;
    const id = parseInt(participantId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid participant ID" },
        { status: 400 }
      );

    const existing = await prisma.campaign_participants.findUnique({
      where: { id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );

    const body = await req.json();
    const { name, email } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;

    const updated = await prisma.campaign_participants.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { error: "Failed to update participant" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const gate = await requirePlatformAdminApi();
  if (!gate.ok)
    return NextResponse.json(
      { error: gate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: gate.status }
    );
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { participantId } = await params;
    const id = parseInt(participantId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid participant ID" },
        { status: 400 }
      );

    await prisma.campaign_participants.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting participant:", error);
    return NextResponse.json(
      { error: "Failed to delete participant" },
      { status: 500 }
    );
  }
}
