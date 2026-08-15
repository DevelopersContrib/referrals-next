import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type CheckoutEventName =
  | "checkout_created"
  | "sdk_ready"
  | "checkout_started"
  | "paypal_opened"
  | "approved"
  | "cancelled"
  | "abandoned"
  | "client_error"
  | "server_error"
  | "activation_started"
  | "activated"
  | "webhook_received"
  | "redirect_created";

const TERMINAL_EVENTS = new Set<CheckoutEventName>([
  "activated",
  "cancelled",
  "abandoned",
  "client_error",
  "server_error",
]);

const STATUS_BY_EVENT: Partial<Record<CheckoutEventName, string>> = {
  checkout_created: "created",
  sdk_ready: "ready",
  checkout_started: "started",
  paypal_opened: "paypal_opened",
  approved: "approved",
  activation_started: "activating",
  activated: "activated",
  cancelled: "cancelled",
  abandoned: "abandoned",
  client_error: "failed",
  server_error: "failed",
  redirect_created: "redirected",
  webhook_received: "webhook_received",
};

type LogCheckoutEventInput = {
  attemptId: string;
  memberId: number;
  planId: number;
  brandId?: number | null;
  eventName: CheckoutEventName;
  checkoutMode?: "in_page" | "redirect" | "webhook";
  paypalSubscriptionId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export function newCheckoutAttemptId() {
  return randomUUID();
}

function cleanText(value: string | null | undefined, max: number) {
  if (!value) return null;
  return value.replace(/\s+/g, " ").trim().slice(0, max) || null;
}

function cleanMetadata(
  metadata: LogCheckoutEventInput["metadata"]
): string | null {
  if (!metadata) return null;

  // Allow scalar operational context only. Never accept cardholder/card data,
  // request headers, cookies, credentials, or arbitrary PayPal payloads.
  const safe = Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) =>
        ["string", "number", "boolean"].includes(typeof value) || value === null
      )
      .slice(0, 20)
      .map(([key, value]) => [key.slice(0, 80), value])
  );
  return JSON.stringify(safe).slice(0, 4000);
}

/**
 * Append an event and update the attempt summary. Logging is deliberately
 * best-effort: audit infrastructure must never block a customer's payment.
 */
export async function logCheckoutEvent(input: LogCheckoutEventInput) {
  const status = STATUS_BY_EVENT[input.eventName] ?? input.eventName;
  const errorCode = cleanText(input.errorCode, 100);
  const errorMessage = cleanText(input.errorMessage, 500);
  const subscriptionId = cleanText(input.paypalSubscriptionId, 200);
  const completedAt = TERMINAL_EVENTS.has(input.eventName) ? new Date() : null;

  try {
    const existing = await prisma.billing_checkout_attempts.findUnique({
      where: { attempt_id: input.attemptId },
      select: { status: true, completed_at: true },
    });
    const existingIsTerminal =
      existing != null &&
      ["activated", "cancelled", "abandoned", "failed"].includes(existing.status);
    // Keep an append-only event even when network reordering delivers an old
    // client event late, but never regress a terminal attempt summary. A real
    // activation may recover an earlier failed/abandoned attempt.
    const preserveTerminal = existingIsTerminal && input.eventName !== "activated";
    const summaryStatus = preserveTerminal ? existing.status : status;
    const summaryCompletedAt = preserveTerminal
      ? existing.completed_at
      : completedAt;

    await prisma.$transaction([
      prisma.billing_checkout_attempts.upsert({
        where: { attempt_id: input.attemptId },
        create: {
          attempt_id: input.attemptId,
          member_id: input.memberId,
          plan_id: input.planId,
          brand_id: input.brandId ?? null,
          provider: "paypal",
          checkout_mode: input.checkoutMode ?? "in_page",
          status: summaryStatus,
          paypal_subscription_id: subscriptionId,
          error_code: errorCode,
          error_message: errorMessage,
          completed_at: summaryCompletedAt,
        },
        update: {
          status: summaryStatus,
          checkout_mode: input.checkoutMode,
          paypal_subscription_id: subscriptionId ?? undefined,
          error_code:
            input.eventName === "activated" ? null : errorCode ?? undefined,
          error_message:
            input.eventName === "activated" ? null : errorMessage ?? undefined,
          completed_at: summaryCompletedAt ?? undefined,
        },
      }),
      prisma.billing_checkout_events.create({
        data: {
          attempt_id: input.attemptId,
          member_id: input.memberId,
          plan_id: input.planId,
          event_name: input.eventName,
          checkout_mode: input.checkoutMode ?? null,
          paypal_subscription_id: subscriptionId,
          error_code: errorCode,
          error_message: errorMessage,
          metadata_json: cleanMetadata(input.metadata),
        },
      }),
    ]);
  } catch (error) {
    console.error("[billing-checkout-log] failed to persist event", {
      attemptId: input.attemptId,
      eventName: input.eventName,
      error,
    });
  }
}
