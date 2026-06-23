import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const deals = await prisma.brand_deals.findMany({
      orderBy: { date_created: "desc" },
      take: 200,
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
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
      category_id,
      url_id,
      member_id,
      title,
      description,
      price,
      banner,
      url,
      how_to,
      date_end,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const deal = await prisma.brand_deals.create({
      data: {
        category_id: category_id ? parseInt(category_id, 10) : 0,
        url_id: url_id ? parseInt(url_id, 10) : 0,
        member_id: member_id ? parseInt(member_id, 10) : 0,
        title,
        description: description || null,
        price: price || null,
        banner: banner || null,
        url: url || null,
        how_to: how_to || null,
        date_end: date_end || null,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
// Deletion is handled by the per-id route (DELETE /api/admin/deals/[dealId]),
// which the admin UI uses — no redundant collection-level DELETE here.
