import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCron } from "@/lib/api/helpers";

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
        // Call PayPal to check subscription status
        const tokenResponse = await fetch(
          `${process.env.PAYPAL_API_URL || "https://api-m.paypal.com"}/v1/oauth2/token`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
          }
        );

        if (!tokenResponse.ok) {
          failed++;
          continue;
        }

        const tokenData = await tokenResponse.json();

        const agreementResponse = await fetch(
          `${process.env.PAYPAL_API_URL || "https://api-m.paypal.com"}/v1/billing/subscriptions/${plan.paypal_agreement_id}`,
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!agreementResponse.ok) {
          failed++;
          continue;
        }

        const agreement = await agreementResponse.json();

        // Update payment record based on PayPal status
        if (plan.payment_id) {
          const status = agreement.status?.toLowerCase();

          await prisma.member_payment.updateMany({
            where: { id: plan.payment_id },
            data: {
              status: status === "active" ? "active" : status === "cancelled" ? "cancelled" : status,
            },
          });

          // If subscription is cancelled or suspended, update the plan
          if (status === "cancelled" || status === "suspended") {
            await prisma.member_plan.update({
              where: { id: plan.id },
              data: {
                agreement_cancel: new Date().toISOString(),
              },
            });
          }
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
