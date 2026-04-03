import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const planId = req.nextUrl.searchParams.get("planId");

  if (planId) {
    const plan = await prisma.plans.findUnique({
      where: { id: parseInt(planId, 10) },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json({ plan });
  }

  const plans = await prisma.plans.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ plans });
}
