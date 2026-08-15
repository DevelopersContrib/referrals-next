import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paypal";
import { postVnocAttribution, resolveVnocPlan } from "@/lib/vnoc-attribution";
import { logPayPalWebhook } from "@/lib/billing-webhook-log";

interface PayPalWebhookEvent {
  event_type?: string;
  resource?: {
    id?: string;
    billing_agreement_id?: string;
    amount?: { total?: string; currency?: string };
  };
}

export async function POST(req: NextRequest) {
  const transmissionId = req.headers.get("paypal-transmission-id");
  let loggedEventType: string | null = null;
  let loggedResourceId: string | null = null;

  try {
    const rawBody = await req.text();
    let body: PayPalWebhookEvent;
    try {
      body = JSON.parse(rawBody) as PayPalWebhookEvent;
    } catch {
      await logPayPalWebhook({
        transmissionId,
        verificationStatus: "rejected",
        processingStatus: "rejected",
        errorMessage: "Invalid JSON",
      });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const transmissionTime = req.headers.get("paypal-transmission-time");
    const transmissionSig = req.headers.get("paypal-transmission-sig");
    const certUrl = req.headers.get("paypal-cert-url");
    const authAlgo = req.headers.get("paypal-auth-algo");

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      await logPayPalWebhook({
        transmissionId,
        eventType: body.event_type,
        resourceId: body.resource?.id,
        verificationStatus: "rejected",
        processingStatus: "rejected",
        errorMessage: "Missing PayPal signature headers",
      });
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
      await logPayPalWebhook({
        transmissionId,
        eventType: body.event_type,
        resourceId: body.resource?.id,
        verificationStatus: "rejected",
        processingStatus: "rejected",
        errorMessage: "Webhook signature verification failed",
      });
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 401 });
    }

    const eventType = body.event_type;
    const resource = body.resource;
    loggedEventType = eventType ?? null;
    loggedResourceId = resource?.id ?? resource?.billing_agreement_id ?? null;

    await logPayPalWebhook({
      transmissionId,
      eventType,
      resourceId: loggedResourceId,
      verificationStatus: "verified",
      processingStatus: "received",
    });

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const agreementId = resource?.id;
        if (agreementId) {
          await prisma.member_plan.updateMany({
            where: { paypal_agreement_id: agreementId },
            data: { agreement_cancel: new Date().toISOString() },
          });

          // Report cancellation to VNOC (idempotent by agreement id).
          const cancelledPlan = await prisma.member_plan.findFirst({
            where: { paypal_agreement_id: agreementId },
            orderBy: { id: "desc" },
          });
          const planRow = cancelledPlan?.payment_id
            ? await prisma.plans.findUnique({ where: { id: cancelledPlan.payment_id } })
            : null;
          const mapped = planRow ? resolveVnocPlan(planRow.price ?? 0) : null;
          after(() =>
            postVnocAttribution({
              product: mapped?.product ?? "referrals",
              eventType: "cancel",
              refExternalId: agreementId,
              planSlug: mapped?.planSlug,
            })
          );
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

            // Report the paid charge to VNOC (idempotent by transaction id).
            const amountUsd = parseFloat(resource.amount?.total || "0");
            const mapped = resolveVnocPlan(amountUsd);
            const txId = resource.id;
            after(() =>
              postVnocAttribution({
                product: mapped?.product ?? "referrals",
                eventType: "paid",
                eventValueUsd: amountUsd,
                refExternalId: txId,
                planSlug: mapped?.planSlug,
                paymentMethod: "paypal",
              })
            );
          }
        }
        break;
      }

      case "PAYMENT.SALE.REFUNDED":
      case "PAYMENT.SALE.REVERSED": {
        // Report the refund/chargeback to VNOC as a negative event.
        const amountUsd = parseFloat(resource?.amount?.total || "0");
        const mapped = amountUsd ? resolveVnocPlan(amountUsd) : null;
        const txId = resource?.id;
        if (txId) {
          after(() =>
            postVnocAttribution({
              product: mapped?.product ?? "referrals",
              eventType: "refund",
              eventValueUsd: amountUsd ? -Math.abs(amountUsd) : undefined,
              refExternalId: txId,
              planSlug: mapped?.planSlug,
              paymentMethod: "paypal",
            })
          );
        }
        break;
      }

      default:
        console.log("Unhandled PayPal event:", eventType);
    }

    await logPayPalWebhook({
      transmissionId,
      eventType,
      resourceId: loggedResourceId,
      verificationStatus: "verified",
      processingStatus: "processed",
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    await logPayPalWebhook({
      transmissionId,
      eventType: loggedEventType,
      resourceId: loggedResourceId,
      verificationStatus: loggedEventType ? "verified" : "pending",
      processingStatus: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown webhook error",
    });
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
