import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ templateId: string }> };

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

    const { templateId } = await params;
    const id = parseInt(templateId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );

    const template = await prisma.campaign_email_content.findUnique({
      where: { id },
    });
    if (!template)
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching email template:", error);
    return NextResponse.json(
      { error: "Failed to fetch email template" },
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

    const { templateId } = await params;
    const id = parseInt(templateId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );

    const existing = await prisma.campaign_email_content.findUnique({
      where: { id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );

    const body = await req.json();
    const { subject, template } = body;

    const data: Record<string, unknown> = {};
    if (subject !== undefined) data.subject = subject;
    if (template !== undefined) data.template = template;

    const updated = await prisma.campaign_email_content.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating email template:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
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

    const { templateId } = await params;
    const id = parseInt(templateId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );

    await prisma.campaign_email_content.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 }
    );
  }
}
