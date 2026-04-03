import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    // Get all campaign IDs for this member
    const campaigns = await prisma.member_campaigns.findMany({
      where: { member_id: memberId },
      select: { id: true, name: true },
    });
    const campaignIds = campaigns.map((c) => c.id);
    const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

    if (campaignIds.length === 0) {
      return NextResponse.json({ participants: [] });
    }

    const where: Record<string, unknown> = {
      campaign_id: { in: campaignIds },
    };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const participants = await prisma.campaign_participants.findMany({
      where,
      orderBy: { date_signedup: "desc" },
      take: 200,
    });

    const result = participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      date_signedup: p.date_signedup,
      campaign_name: campaignMap.get(p.campaign_id) || `Campaign #${p.campaign_id}`,
    }));

    return NextResponse.json({ participants: result });
  } catch (error) {
    console.error("Contacts GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Store as a visitor/contact form submission
    await prisma.visitors.create({
      data: {
        name,
        email,
        date_signedup: new Date(),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Contacts POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
