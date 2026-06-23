import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const __adminGate = await requirePlatformAdminApi();
  if (!__adminGate.ok)
    return NextResponse.json(
      { error: __adminGate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: __adminGate.status }
    );
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subdomains = await prisma.brand_subdomains.findMany({
      orderBy: { date_created: "desc" },
      take: 200,
    });

    return NextResponse.json(subdomains);
  } catch (error) {
    console.error("Error fetching subdomains:", error);
    return NextResponse.json(
      { error: "Failed to fetch subdomains" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const __adminGate = await requirePlatformAdminApi();
  if (!__adminGate.ok)
    return NextResponse.json(
      { error: __adminGate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: __adminGate.status }
    );
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { url_id, created_by, subdomain, google_ua, header_script } = body;

    const urlId = parseInt(url_id, 10);
    const createdBy = parseInt(created_by, 10);

    if (isNaN(urlId) || isNaN(createdBy)) {
      return NextResponse.json(
        { error: "Brand ID and Created By are required" },
        { status: 400 }
      );
    }

    const subdomainRow = await prisma.brand_subdomains.create({
      data: {
        url_id: urlId,
        created_by: createdBy,
        subdomain: subdomain || null,
        google_ua: google_ua || null,
        header_script: header_script || null,
      },
    });

    return NextResponse.json(subdomainRow, { status: 201 });
  } catch (error) {
    console.error("Error creating subdomain:", error);
    return NextResponse.json(
      { error: "Failed to create subdomain" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const __adminGate = await requirePlatformAdminApi();
  if (!__adminGate.ok)
    return NextResponse.json(
      { error: __adminGate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: __adminGate.status }
    );
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10);

    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

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
