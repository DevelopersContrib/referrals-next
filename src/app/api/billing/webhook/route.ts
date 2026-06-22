import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paypal";

interface PayPalWebhookEvent {
  event_type?: string;
  resource?: {
    id?: string;
    billing_agreement_id?: string;
    amount?: { total?: string; currency?: string };
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: PayPalWebhookEvent;
    try {
      body = JSON.parse(rawBody) as PayPalWebhookEvent;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const transmissionId = req.headers.get("paypal-transmission-id");
    const transmissionTime = req.headers.get("paypal-transmission-time");
    const transmissionSig = req.headers.get("paypal-transmission-sig");
    const certUrl = req.headers.get("paypal-cert-url");
    const authAlgo = req.headers.get("paypal-auth-algo");

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      return NextResponse.json({ error: "Missing PayPal signature headers" }, { status: 401 });
    }

    const verified = await verifyWebhookSignature(
      {
        transmissionId,
        transmissionTime,
        transmissionSig,
        certUrl,
        authAlgo,
      },
      body
    );

    if (!verified) {
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 401 });
    }

    const eventType = body.event_type;
    const resource = body.resource;

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const agreementId = resource?.id;
        if (agreementId) {
          await prisma.member_plan.updateMany({
            where: { paypal_agreement_id: agreementId },
            data: { agreement_cancel: new Date().toISOString() },
          });
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const agreementId = resource?.id;
        if (agreementId) {
          await prisma.member_plan.updateMany({
            where: { paypal_agreement_id: agreementId },
            data: { agreement_activate: new Date().toISOString() },
          });
        }
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        const agreementId = resource?.billing_agreement_id;
        if (agreementId) {
          const plan = await prisma.member_plan.findFirst({
            where: { paypal_agreement_id: agreementId },
          });
          if (plan) {
            await prisma.member_payment.create({
              data: {
                member_id: plan.member_id,
                amount: parseFloat(resource.amount?.total || "0"),
                datetime_created: new Date(),
                status: "completed",
                transaction_id: resource.id,
                currency: resource.amount?.currency || "USD",
              },
            });

            // Extend plan expiry by 30 days
            const member = await prisma.members.findUnique({ where: { id: plan.member_id } });
            const currentExpiry = member?.plan_expiry ? new Date(member.plan_expiry) : new Date();
            const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()));
            newExpiry.setDate(newExpiry.getDate() + 30);

            await prisma.members.update({
              where: { id: plan.member_id },
              data: { plan_expiry: newExpiry },
            });
          }
        }
        break;
      }

      default:
        console.log("Unhandled PayPal event:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
