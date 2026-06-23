import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.member_payment.findMany({
        where,
        orderBy: { datetime_created: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member_payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
