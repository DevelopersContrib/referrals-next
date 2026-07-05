// Unambiguous character set — excludes I, O, 0, 1 to avoid transcription errors.
export const DEFAULT_COUPON_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface CouponGenOptions {
  count: number;
  length?: number;
  prefix?: string;
  charset?: string;
  /** Existing codes to avoid duplicating (case-insensitive). */
  exclude?: Iterable<string>;
}

function clampInt(value: number, min: number, max: number, fallback: number) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function randomInt(maxExclusive: number): number {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto?.getRandomValues
  ) {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

/** Generate a batch of unique coupon codes. */
export function generateCouponCodes(opts: CouponGenOptions): string[] {
  const count = clampInt(opts.count, 1, 1000, 10);
  const length = clampInt(opts.length ?? 8, 3, 32, 8);
  const prefix = (opts.prefix ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);
  const charset =
    opts.charset && opts.charset.length >= 2
      ? opts.charset
      : DEFAULT_COUPON_CHARSET;

  const existing = new Set(
    Array.from(opts.exclude ?? [], (c) => String(c).trim().toUpperCase())
  );

  const out = new Set<string>();
  let guard = count * 50 + 100;
  while (out.size < count && guard-- > 0) {
    let body = "";
    for (let i = 0; i < length; i++) {
      body += charset[randomInt(charset.length)];
    }
    const code = prefix + body;
    if (!existing.has(code) && !out.has(code)) out.add(code);
  }
  return Array.from(out);
}

/** Convenience: a single example code for previews. */
export function exampleCouponCode(prefix: string, length: number): string {
  const [code] = generateCouponCodes({ count: 1, prefix, length });
  return code ?? "";
}
