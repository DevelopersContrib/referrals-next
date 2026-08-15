import { prisma } from "@/lib/prisma";

type WebhookLogInput = {
  transmissionId?: string | null;
  eventType?: string | null;
  resourceId?: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  processingStatus: "received" | "processed" | "failed" | "rejected";
  errorMessage?: string | null;
};

function clean(value: string | null | undefined, max: number) {
  return value?.replace(/\s+/g, " ").trim().slice(0, max) || null;
}

/** Best-effort and payload-free: never persist secrets or full PayPal bodies. */
export async function logPayPalWebhook(input: WebhookLogInput) {
  const data = {
    event_type: clean(input.eventType, 100),
    resource_id: clean(input.resourceId, 200),
    verification_status: input.verificationStatus,
    processing_status: input.processingStatus,
    error_message: clean(input.errorMessage, 500),
    processed_at:
      input.processingStatus === "processed" || input.processingStatus === "failed"
        ? new Date()
        : null,
  };

  try {
    const transmissionId = clean(input.transmissionId, 100);
    if (transmissionId) {
      await prisma.billing_paypal_webhook_events.upsert({
        where: { transmission_id: transmissionId },
        create: { transmission_id: transmissionId, ...data },
        update: data,
      });
    } else {
      await prisma.billing_paypal_webhook_events.create({
        data: { transmission_id: null, ...data },
      });
    }
  } catch (error) {
    console.error("[billing-webhook-log] failed to persist delivery", error);
  }
}
