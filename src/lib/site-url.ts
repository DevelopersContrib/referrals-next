/** Live site origin. Canonicals must use www — the apex host redirects. */
export const SITE_ORIGIN = "https://www.referrals.com";

/** Prefer www when config still points at the apex host. */
export function canonicalOrigin(configured?: string | null): string {
  const raw = (configured || SITE_ORIGIN).trim().replace(/\/+$/, "");
  if (raw === "https://referrals.com" || raw === "http://referrals.com") {
    return SITE_ORIGIN;
  }
  return raw;
}

export function siteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_ORIGIN;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}
