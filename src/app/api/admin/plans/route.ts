import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plans = await prisma.plans.findMany({
      orderBy: { id: "asc" },
    });

    // Get subscriber count for each plan
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const subscriberCount = await prisma.members.count({
          where: { plan_id: plan.id },
        });
        return { ...plan, subscriberCount };
      })
    );

    return NextResponse.json(plansWithCounts);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      price,
      campaigns_participants,
      no_of_domains,
      unit,
      no_unit,
      days,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Plan name is required" },
        { status: 400 }
      );
    }

    const plan = await prisma.plans.create({
      data: {
        name,
        price: price ? parseFloat(price) : 0,
        campaigns_participants: campaigns_participants
          ? parseInt(campaigns_participants, 10)
          : 0,
        no_of_domains: no_of_domains ? parseInt(no_of_domains, 10) : 0,
        unit: unit || "month",
        no_unit: no_unit ? parseInt(no_unit, 10) : 0,
        days: days ? parseInt(days, 10) : 0,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}
