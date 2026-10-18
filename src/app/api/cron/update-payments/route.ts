import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCron } from "@/lib/api/helpers";
import { getSubscription } from "@/lib/paypal";

export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all active member plans with PayPal agreement IDs
    const activePlans = await prisma.member_plan.findMany({
      where: {
        paypal_agreement_id: { not: null },
        agreement_cancel: null,
      },
    });

    let updated = 0;
    let failed = 0;

    for (const plan of activePlans) {
      if (!plan.paypal_agreement_id) continue;

      try {
        const agreement = await getSubscription(plan.paypal_agreement_id);
        const status = String(agreement.status ?? "").toLowerCase();
        if (!status) {
          failed++;
          continue;
        }

        await prisma.member_payment.updateMany({
          where: {
            member_id: plan.member_id,
            transaction_id: plan.paypal_agreement_id,
          },
          data: {
            status:
              status === "active"
                ? "completed"
                : status === "cancelled"
                  ? "cancelled"
                  : status,
          },
        });

        if (status === "cancelled" || status === "suspended") {
          await prisma.member_plan.update({
            where: { id: plan.id },
            data: {
              agreement_cancel: new Date().toISOString(),
            },
          });
        }

        updated++;
      } catch (err) {
        console.error(`Failed to sync payment for plan ${plan.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      total_plans: activePlans.length,
      updated,
      failed,
    });
  } catch (error) {
    console.error("Update payments cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
