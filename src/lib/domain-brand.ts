import { lookupVnocDomain } from "@/lib/analysis/vnoc";
import { crawlSite } from "@/lib/analysis/crawler";

/**
 * A zero-setup, auto-branded card for ANY domain — the primitive behind
 * auto-generated referral programs. Layered, cache-free, never throws:
 *   1. lookupVnocDomain (VNOC network — instant for our domains)
 *   2. brandidentity.com/logo/<domain> as the guaranteed logo fallback
 *   3. optional light crawl (opts.crawl) for name/colors when not in VNOC
 * Mirrors the fallback philosophy of <BrandLogo>.
 */
export interface DomainBrandCard {
  domain: string;
  name: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  colors: string[];
  description: string | null;
  tagline: string | null;
  inVnoc: boolean;
  source: "vnoc" | "crawl" | "fallback";
}

export function normalizeDomain(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export function brandIdentityLogo(domain: string): string {
  return `https://www.brandidentity.com/logo/${normalizeDomain(domain)}`;
}

export async function resolveDomainBrand(
  domain: string,
  opts?: { crawl?: boolean }
): Promise<DomainBrandCard> {
  const clean = normalizeDomain(domain);
  const card: DomainBrandCard = {
    domain: clean,
    name: null,
    logoUrl: null,
    faviconUrl: null,
    colors: [],
    description: null,
    tagline: null,
    inVnoc: false,
    source: "fallback",
  };
  if (!clean) return card;

  try {
    const v = await lookupVnocDomain(clean);
    if (v.matched) {
      card.inVnoc = true;
      card.source = "vnoc";
      card.name = v.name;
      card.logoUrl = v.logoUrl;
      card.description = v.description;
      card.tagline = v.tagline;
    }
  } catch {
    /* never throw — fall through to fallbacks */
  }

  // Guaranteed logo (BrandLogo will further fall back client-side if it 404s).
  if (!card.logoUrl) card.logoUrl = brandIdentityLogo(clean);

  if (opts?.crawl && (!card.name || card.colors.length === 0 || !card.description)) {
    try {
      const c = await crawlSite(clean);
      if (!card.inVnoc) card.source = "crawl";
      card.name = card.name || c.name || null;
      card.logoUrl = card.logoUrl || c.logoUrl || null;
      card.faviconUrl = c.faviconUrl || null;
      card.colors = c.colors || [];
      card.description = card.description || c.metaDescription || null;
    } catch {
      /* crawl is best-effort */
    }
  }

  if (!card.name) card.name = clean;
  return card;
}
