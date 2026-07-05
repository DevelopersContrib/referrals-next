export type RewardKind = "coupons" | "redirect" | "custom" | "cash" | "tokens";

export function getRewardKind(name: string | undefined): RewardKind | null {
  const n = (name || "").toLowerCase();
  if (n.includes("coupon")) return "coupons";
  if (n.includes("redirect")) return "redirect";
  if (n.includes("custom")) return "custom";
  if (n.includes("cash")) return "cash";
  if (n.includes("token")) return "tokens";
  return null;
}

export interface RewardFormValues {
  coupon_codes: string;
  redirect_url: string;
  custom_message: string;
  cash_value: string;
  worth_value: string;
  token_symbol: string;
  token_address: string;
  token_amount: string;
}

export function emptyRewardFormValues(): RewardFormValues {
  return {
    coupon_codes: "",
    redirect_url: "",
    custom_message: "",
    cash_value: "",
    worth_value: "",
    token_symbol: "",
    token_address: "",
    token_amount: "",
  };
}

export function rewardFormValuesFromRecord(
  reward: {
    redirect_url?: string | null;
    custom_message?: string | null;
    cash_value?: number | null;
    worth_value?: number | null;
    token_symbol?: string | null;
    token_address?: string | null;
    token_amount?: string | null;
  } | null | undefined
): RewardFormValues {
  return {
    coupon_codes: "",
    redirect_url: reward?.redirect_url || "",
    custom_message: reward?.custom_message || "",
    cash_value:
      reward?.cash_value != null && reward.cash_value > 0
        ? String(reward.cash_value)
        : "",
    worth_value:
      reward?.worth_value != null ? String(reward.worth_value) : "",
    token_symbol: reward?.token_symbol || "",
    token_address: reward?.token_address || "",
    token_amount: reward?.token_amount || "",
  };
}

export function buildRewardPayload(
  kind: RewardKind | null,
  values: RewardFormValues
): Record<string, string | number | null> {
  const cleared = {
    redirect_url: null,
    custom_message: null,
    cash_value: 0,
    worth_value: null,
    token_symbol: null,
    token_address: null,
    token_amount: null,
  };

  if (kind === "redirect" && values.redirect_url.trim()) {
    return {
      ...cleared,
      redirect_url: values.redirect_url.trim().slice(0, 100),
    };
  }

  if (kind === "custom" && values.custom_message.trim()) {
    return {
      ...cleared,
      custom_message: values.custom_message.trim(),
    };
  }

  if (kind === "cash") {
    const cash = parseFloat(values.cash_value);
    const worth = values.worth_value.trim()
      ? parseFloat(values.worth_value)
      : null;
    return {
      ...cleared,
      cash_value: Number.isFinite(cash) ? cash : 0,
      worth_value: worth != null && Number.isFinite(worth) ? worth : null,
    };
  }

  if (kind === "tokens") {
    return {
      ...cleared,
      token_symbol: values.token_symbol.trim().slice(0, 100) || null,
      token_address: values.token_address.trim().slice(0, 100) || null,
      token_amount: values.token_amount.trim().slice(0, 100) || null,
    };
  }

  return cleared;
}

/** Whitelisted reward columns accepted from client input (mirrors PHP CampaignReward save). */
export interface SanitizedRewardInput {
  redirect_url?: string;
  custom_message?: string;
  cash_value?: number;
  worth_value?: number;
  token_symbol?: string;
  token_address?: string;
  token_amount?: string;
}

/**
 * Server-safe sanitizer for a reward payload coming from the client.
 * Only known columns pass through; strings are trimmed/length-capped and
 * numeric fields are parsed. Used by both create and update campaign flows.
 */
export function sanitizeRewardInput(reward: unknown): SanitizedRewardInput {
  const out: SanitizedRewardInput = {};
  if (!reward || typeof reward !== "object") return out;
  const r = reward as Record<string, unknown>;

  if (typeof r.redirect_url === "string" && r.redirect_url.trim()) {
    out.redirect_url = r.redirect_url.trim().slice(0, 100);
  }
  if (typeof r.custom_message === "string" && r.custom_message.trim()) {
    out.custom_message = r.custom_message.trim();
  }
  if (r.cash_value != null && r.cash_value !== "") {
    const cash = parseFloat(String(r.cash_value));
    if (Number.isFinite(cash)) out.cash_value = cash;
  }
  if (r.worth_value != null && r.worth_value !== "") {
    const worth = parseFloat(String(r.worth_value));
    if (Number.isFinite(worth)) out.worth_value = worth;
  }
  if (typeof r.token_symbol === "string" && r.token_symbol.trim()) {
    out.token_symbol = r.token_symbol.trim().slice(0, 100);
  }
  if (typeof r.token_address === "string" && r.token_address.trim()) {
    out.token_address = r.token_address.trim().slice(0, 100);
  }
  if (typeof r.token_amount === "string" && r.token_amount.trim()) {
    out.token_amount = r.token_amount.trim().slice(0, 100);
  }
  return out;
}

export function parseCouponCodes(raw: string): string[] {
  return raw
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function validateRewardConfig(
  kind: RewardKind | null,
  values: RewardFormValues,
  options?: { requireCoupons?: boolean }
): string | null {
  if (!kind) return "Select a reward type.";

  if (kind === "coupons") {
    if (options?.requireCoupons && parseCouponCodes(values.coupon_codes).length === 0) {
      return "Enter at least one coupon code (one per line).";
    }
    return null;
  }

  if (kind === "redirect") {
    const url = values.redirect_url.trim();
    if (!url) return "Enter the redirect URL.";
    try {
      new URL(url);
    } catch {
      return "Enter a valid redirect URL (include https://).";
    }
    return null;
  }

  if (kind === "custom") {
    if (!values.custom_message.trim()) return "Enter the custom reward message.";
    return null;
  }

  if (kind === "cash") {
    const value = parseFloat(values.cash_value);
    if (!Number.isFinite(value) || value <= 0) {
      return "Enter a cash reward amount greater than zero.";
    }
    return null;
  }

  if (kind === "tokens") {
    if (!values.token_symbol.trim() || !values.token_amount.trim()) {
      return "Enter the token symbol and amount.";
    }
    return null;
  }

  return null;
}
