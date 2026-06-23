/** Shared number/currency formatters for the admin UI. */

export function fmtNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function fmtMoney(
  n: number | null | undefined,
  opts: { currency?: string | null; fractionDigits?: number } = {}
) {
  if (n == null) return "—";
  const base = n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts.fractionDigits ?? 0,
  });
  return opts.currency && opts.currency !== "USD" ? `${base} ${opts.currency}` : base;
}
