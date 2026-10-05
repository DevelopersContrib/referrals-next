/** Bare domain — "giftcast.com", "my-shop.co.uk". No scheme, path, or spaces. */
const BARE_DOMAIN = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/i;

/**
 * Display form for a brand's domain: "giftcast.com" -> "Giftcast.com".
 *
 * Only the first letter is raised. CSS `capitalize` title-cases every
 * dot-separated segment and produces "Giftcast.Com", which is why callers
 * should use this instead. The remainder is left alone so deliberate casing
 * ("YouTube.com") survives, and values that aren't bare domains (real brand
 * names like "Acme Corp") are returned untouched.
 */
export function formatBrandName(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const bare = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");

  if (!BARE_DOMAIN.test(bare)) return raw;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

/** Picks the singular or plural form for `count`. */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return Math.abs(count) === 1 ? singular : plural;
}

/** "1 signup", "7 signups" — count and its correctly pluralized noun. */
export function formatCount(
  count: number,
  singular: string,
  plural?: string,
): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}
