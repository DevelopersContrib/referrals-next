/**
 * VNOC attribution postback client (server-to-server).
 *
 * Posts brand lifecycle events (signup, paid, refund, cancel, …) to VNOC's
 * attribution endpoint so they show up on Domain → Products in manage.
 *
 * Contract + credentials: see the VNOC attribution handoff doc.
 *   POST {VNOC_ATTRIBUTION_URL}/api/vnoc-products/attribution
 *   Authorization: Bearer {per-product token}
 *
 * Design rules:
 * - Server only. The Bearer token must never reach the client — do not import
 *   this from a "use client" file.
 * - Never throws. A tracking hiccup must never break signup/billing. Callers
 *   can safely `void postVnocAttribution(...)` (fire-and-forget) or await it.
 * - Idempotent by (event_type, ref_external_id): VNOC de-dupes re-posts, so
 *   retrying with a stable id (member id, transaction id) is safe.
 *
 * This module intentionally does NO route wiring — it's the reusable transport
 * + config layer. Wire it into register/billing handlers separately.
 */

/** Products configured on referrals.com (domain 971). Env keys are slug-prefixed. */
export type VnocProduct = "referrals" | "referralstier";

export type VnocEventType =
  | "signup"
  | "trial"
  | "paid"
  | "refund"
  | "cancel"
  | "churn"
  | "upgrade"
  | "downgrade"
  | "support_case"
  | "support_resolved"
  | "impression"
  | "click";

export type VnocPaymentMethod =
  | "stripe"
  | "paypal"
  | "paydirect"
  | "coinbase"
  | "other";

export interface VnocEvent {
  product: VnocProduct;
  eventType: VnocEventType;
  /** Stable id for idempotency (member id, transaction id, ticket id, …). */
  refExternalId?: string;
  /** USD amount; positive for paid, negative for refund. */
  eventValueUsd?: number;
  /** Tier slug — send on paid/refund/trial/cancel/churn/upgrade/downgrade. */
  planSlug?: string;
  paymentMethod?: VnocPaymentMethod;
  paymentAccount?: string;
  payerEmail?: string;
  refCode?: string | null;
  commissionOwedUsd?: number;
}

export interface VnocResult {
  ok: boolean;
  /** True when the client is not configured (missing env) — a no-op, not a failure. */
  skipped?: boolean;
  idempotent?: boolean;
  attributionId?: string | number;
  error?: string;
}

/**
 * Known plans per product, straight from the handoff doc. Use
 * {@link resolveVnocPlan} to map a local price to a product + plan_slug.
 */
export const VNOC_PLAN_CATALOG: Record<
  VnocProduct,
  { planSlug: string; priceUsd: number; billing: "month" | "year" }[]
> = {
  referrals: [
    { planSlug: "per-brand", priceUsd: 9, billing: "month" },
    { planSlug: "by-brand-yearly", priceUsd: 99, billing: "year" },
    { planSlug: "unlimited", priceUsd: 1999, billing: "year" },
  ],
  referralstier: [
    { planSlug: "partner-premium", priceUsd: 70, billing: "month" },
    { planSlug: "partner-ultimate", priceUsd: 350, billing: "month" },
  ],
};

interface ProductConfig {
  productId: string;
  token: string;
}

function readProductConfig(product: VnocProduct): ProductConfig | null {
  const prefix = product === "referrals" ? "VNOC_REFERRALS" : "VNOC_REFERRALSTIER";
  const productId = process.env[`${prefix}_PRODUCT_ID`];
  const token = process.env[`${prefix}_ATTRIBUTION_TOKEN`];
  if (!productId || !token) return null;
  return { productId, token };
}

/**
 * Best-effort map of a charge amount to a product + plan_slug, matching the
 * catalog by price (optionally constrained to a billing period). Returns null
 * when nothing matches so the caller can decide whether to send a bare event.
 */
export function resolveVnocPlan(
  priceUsd: number,
  billing?: "month" | "year"
): { product: VnocProduct; planSlug: string } | null {
  for (const product of Object.keys(VNOC_PLAN_CATALOG) as VnocProduct[]) {
    for (const plan of VNOC_PLAN_CATALOG[product]) {
      if (plan.priceUsd === priceUsd && (!billing || plan.billing === billing)) {
        return { product, planSlug: plan.planSlug };
      }
    }
  }
  return null;
}

/** True when at least one product is configured (env present). */
export function isVnocAttributionConfigured(): boolean {
  return (
    readProductConfig("referrals") !== null ||
    readProductConfig("referralstier") !== null
  );
}

/** All-time baseline seed for a product (manage tiles = baseline + live events). */
export interface VnocBaseline {
  /** ISO timestamp; manage counts live events with ts >= as_of. Defaults to now. */
  asOf?: string;
  signups?: number;
  paidCount?: number;
  revenueUsd?: number;
  refundsCount?: number;
  refundsUsd?: number;
  notes?: string;
}

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Post a single attribution event. Never throws — returns a result object.
 * When the product isn't configured, returns `{ ok: false, skipped: true }`.
 */
export async function postVnocAttribution(event: VnocEvent): Promise<VnocResult> {
  try {
    const baseUrl = process.env.VNOC_ATTRIBUTION_URL;
    const domainId = process.env.VNOC_DOMAIN_ID;
    const config = readProductConfig(event.product);

    if (!baseUrl || !domainId || !config) {
      return { ok: false, skipped: true };
    }

    const payload: Record<string, unknown> = {
      product_id: Number(config.productId),
      domain_id: Number(domainId),
      event_type: event.eventType,
    };
    if (event.refExternalId != null) payload.ref_external_id = event.refExternalId;
    if (event.eventValueUsd != null) payload.event_value_usd = event.eventValueUsd;
    if (event.planSlug) payload.plan_slug = event.planSlug;
    if (event.paymentMethod) payload.payment_method = event.paymentMethod;
    if (event.paymentAccount) payload.payment_account = event.paymentAccount;
    if (event.payerEmail) payload.payer_email = event.payerEmail;
    if (event.refCode !== undefined) payload.ref_code = event.refCode;
    if (event.commissionOwedUsd != null)
      payload.commission_owed_usd = event.commissionOwedUsd;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/api/vnoc-products/attribution`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      idempotent?: boolean;
      attribution_id?: string | number;
      error?: string;
    };

    if (!res.ok) {
      console.error(
        `[vnoc-attribution] ${event.product}/${event.eventType} failed: ${res.status} ${data.error || ""}`
      );
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }

    return {
      ok: true,
      idempotent: data.idempotent,
      attributionId: data.attribution_id,
    };
  } catch (err) {
    console.error("[vnoc-attribution] postback error (non-fatal):", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/**
 * Seed a product's all-time baseline (run once at go-live). Never throws.
 *
 * Manage tiles = baseline + live events with `ts >= as_of`, so do NOT include
 * post-go-live activity here (that would double-count).
 */
export async function putVnocBaseline(
  product: VnocProduct,
  baseline: VnocBaseline
): Promise<VnocResult> {
  try {
    const baseUrl = process.env.VNOC_ATTRIBUTION_URL;
    const domainId = process.env.VNOC_DOMAIN_ID;
    const config = readProductConfig(product);

    if (!baseUrl || !domainId || !config) {
      return { ok: false, skipped: true };
    }

    const payload: Record<string, unknown> = {
      product_id: Number(config.productId),
      domain_id: Number(domainId),
      as_of: baseline.asOf ?? new Date().toISOString(),
    };
    if (baseline.signups != null) payload.signups = baseline.signups;
    if (baseline.paidCount != null) payload.paid_count = baseline.paidCount;
    if (baseline.revenueUsd != null) payload.revenue_usd = baseline.revenueUsd;
    if (baseline.refundsCount != null) payload.refunds_count = baseline.refundsCount;
    if (baseline.refundsUsd != null) payload.refunds_usd = baseline.refundsUsd;
    if (baseline.notes) payload.notes = baseline.notes;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/api/vnoc-products/attribution/baseline`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };

    if (!res.ok) {
      console.error(
        `[vnoc-attribution] baseline ${product} failed: ${res.status} ${data.error || ""}`
      );
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("[vnoc-attribution] baseline error (non-fatal):", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}
