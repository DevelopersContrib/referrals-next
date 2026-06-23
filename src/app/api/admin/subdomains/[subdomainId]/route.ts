import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ subdomainId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const { subdomainId } = await params;
    const id = parseInt(subdomainId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid subdomain ID" },
        { status: 400 }
      );

    const subdomain = await prisma.brand_subdomains.findUnique({
      where: { id },
    });
    if (!subdomain)
      return NextResponse.json(
        { error: "Subdomain not found" },
        { status: 404 }
      );

    return NextResponse.json(subdomain);
  } catch (error) {
    console.error("Error fetching subdomain:", error);
    return NextResponse.json(
      { error: "Failed to fetch subdomain" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const { subdomainId } = await params;
    const id = parseInt(subdomainId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid subdomain ID" },
        { status: 400 }
      );

    const existing = await prisma.brand_subdomains.findUnique({
      where: { id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Subdomain not found" },
        { status: 404 }
      );

    const body = await req.json();
    const { url_id, created_by, subdomain, google_ua, header_script } = body;

    const data: Record<string, unknown> = {};
    if (url_id !== undefined) data.url_id = parseInt(url_id, 10);
    if (created_by !== undefined) data.created_by = parseInt(created_by, 10);
    if (subdomain !== undefined) data.subdomain = subdomain || null;
    if (google_ua !== undefined) data.google_ua = google_ua || null;
    if (header_script !== undefined) data.header_script = header_script || null;

    const updated = await prisma.brand_subdomains.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating subdomain:", error);
    return NextResponse.json(
      { error: "Failed to update subdomain" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const { subdomainId } = await params;
    const id = parseInt(subdomainId, 10);
    if (isNaN(id))
      return NextResponse.json(
        { error: "Invalid subdomain ID" },
        { status: 400 }
      );

    await prisma.brand_subdomains.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subdomain:", error);
    return NextResponse.json(
      { error: "Failed to delete subdomain" },
      { status: 500 }
    );
  }
}
