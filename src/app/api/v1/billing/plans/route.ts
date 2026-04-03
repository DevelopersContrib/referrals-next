import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(_req: NextRequest) {
  try {
    const plans = await prisma.plans.findMany({
      orderBy: { price: "asc" },
    });

    return apiSuccess({
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        campaigns_participants: plan.campaigns_participants,
        no_of_domains: plan.no_of_domains,
        unit: plan.unit,
        no_unit: plan.no_unit,
        days: plan.days,
      })),
    });
  } catch (error) {
    console.error("List plans error:", error);
    return apiError("Internal server error", 500);
  }
}
