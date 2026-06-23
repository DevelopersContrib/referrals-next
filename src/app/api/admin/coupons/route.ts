import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const coupons = await prisma.campaign_coupons.findMany({
      orderBy: { id: "desc" },
      take: 200,
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { campaign_id, code, is_used } = body;

    if (campaign_id === undefined || campaign_id === null || campaign_id === "") {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const campaignId = parseInt(campaign_id, 10);
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    const coupon = await prisma.campaign_coupons.create({
      data: {
        campaign_id: campaignId,
        code: code || null,
        is_used: is_used ?? false,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
