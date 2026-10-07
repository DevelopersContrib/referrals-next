/**
 * Well-known third-party brands Referrals.com does not own.
 * Public /p/{slug} pages and sitemap entries for these names impersonate
 * the trademark holder, so they stay out of search and return 404.
 */
const BLOCKED_ROOTS = new Set([
  "adidas",
  "adobe",
  "airbnb",
  "amazon",
  "apple",
  "discord",
  "ebay",
  "facebook",
  "fb",
  "github",
  "google",
  "instagram",
  "linkedin",
  "mcdonalds",
  "meta",
  "microsoft",
  "netflix",
  "nike",
  "openai",
  "paypal",
  "pinterest",
  "reddit",
  "salesforce",
  "snapchat",
  "spotify",
  "starbucks",
  "target",
  "tiktok",
  "twitch",
  "twitter",
  "uber",
  "w3schools",
  "walmart",
  "whatsapp",
  "wikipedia",
  "yahoo",
  "youtube",
]);

const SLUG_TLDS = ["com", "org", "net", "io", "co", "uk"];

function cleanedHost(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]
    .replace(/\.$/, "");
}

function matchesBlocked(value: string): boolean {
  const cleaned = cleanedHost(value);
  if (!cleaned) return false;
  if (BLOCKED_ROOTS.has(cleaned)) return true;

  const firstLabel = cleaned.split(".")[0];
  if (
    BLOCKED_ROOTS.has(firstLabel) &&
    (cleaned === firstLabel || cleaned.startsWith(`${firstLabel}.`))
  ) {
    return true;
  }

  for (const root of BLOCKED_ROOTS) {
    if (SLUG_TLDS.some((tld) => cleaned === `${root}-${tld}`)) return true;
  }
  return false;
}

/** True when a public brand page would present a company this site does not own. */
export function isUnownedTrademarkBrand(brand: {
  slug?: string | null;
  domain?: string | null;
}): boolean {
  if (brand.domain && matchesBlocked(brand.domain)) return true;
  if (brand.slug && matchesBlocked(brand.slug)) return true;
  return false;
}
