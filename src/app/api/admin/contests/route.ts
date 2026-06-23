import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const contests = await prisma.campaign_contest.findMany({
      orderBy: { date_added: "desc" },
      take: 200,
    });

    return NextResponse.json(contests);
  } catch (error) {
    console.error("Error fetching contests:", error);
    return NextResponse.json(
      { error: "Failed to fetch contests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const body = await req.json();
    const {
      campaign_id,
      contest_name,
      contest_type_id,
      description,
      start_date,
      end_date,
      member_id,
      max_winners,
      max_display,
      is_on,
      winner_email,
    } = body;

    if (!contest_name) {
      return NextResponse.json(
        { error: "Contest name is required" },
        { status: 400 }
      );
    }
    if (campaign_id === undefined || campaign_id === null || campaign_id === "") {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }
    if (member_id === undefined || member_id === null || member_id === "") {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const contest = await prisma.campaign_contest.create({
      data: {
        campaign_id: parseInt(campaign_id, 10),
        contest_name,
        contest_type_id: contest_type_id ? parseInt(contest_type_id, 10) : 0,
        description: description || null,
        start_date: start_date || null,
        end_date: end_date || null,
        member_id: parseInt(member_id, 10),
        max_winners: max_winners ? parseInt(max_winners, 10) : 1,
        max_display: max_display ? parseInt(max_display, 10) : 10,
        is_on: is_on ?? false,
        winner_email: winner_email || null,
      },
    });

    return NextResponse.json(contest, { status: 201 });
  } catch (error) {
    console.error("Error creating contest:", error);
    return NextResponse.json(
      { error: "Failed to create contest" },
      { status: 500 }
    );
  }
}
