import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";

    const where = search ? { name: { contains: search } } : {};

    const [campaigns, total] = await Promise.all([
      prisma.member_campaigns.findMany({
        where,
        orderBy: { date_added: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member_campaigns.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
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
    const { url_id, name } = body;

    if (url_id === undefined || url_id === null || url_id === "") {
      return NextResponse.json(
        { error: "Brand (url_id) is required" },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    const urlId = parseInt(url_id, 10);
    if (isNaN(urlId)) {
      return NextResponse.json(
        { error: "Invalid brand (url_id)" },
        { status: 400 }
      );
    }

    const brand = await prisma.member_urls.findUnique({
      where: { id: urlId },
      select: { id: true, member_id: true },
    });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const campaign = await prisma.member_campaigns.create({
      data: {
        url_id: urlId,
        member_id: brand.member_id,
        name,
        type_id: body.type_id ? parseInt(body.type_id, 10) : 1,
        reward_type: body.reward_type ? parseInt(body.reward_type, 10) : 0,
        publish: body.publish ?? "public",
        goal_type: body.goal_type ?? null,
        num_visits:
          body.num_visits !== undefined && body.num_visits !== null && body.num_visits !== ""
            ? parseInt(body.num_visits, 10)
            : null,
        num_signups:
          body.num_signups !== undefined && body.num_signups !== null && body.num_signups !== ""
            ? parseInt(body.num_signups, 10)
            : null,
        allow_email: body.allow_email ?? false,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
