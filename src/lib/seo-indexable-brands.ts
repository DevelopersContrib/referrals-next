import { prisma } from "@/lib/prisma";
import { isUnownedTrademarkBrand } from "@/lib/blocked-brands";
import { isBrandGrowthEntitled } from "@/lib/member-subscription";

/**
 * Which public brand pages (/p/{slug}) search engines should see.
 *
 * A brand page is indexable only when the brand is live (same rule as
 * getBrandEntitlement: verified owner, and VNOC or an unexpired paid
 * url_plan) AND it has at least one public campaign. Private brands, empty
 * pages and unowned trademarks stay out of the sitemap and get noindex.
 */

/** Hosted-blog subdomains: never the member's own brand, mostly spam. */
const HOSTED_BLOG_SUFFIXES = [
  "blogspotcom",
  "wordpresscom",
  "wixsitecom",
  "weeblycom",
  "tumblrcom",
];

function isHostedBlogBrand(brand: { slug?: string | null; domain?: string | null }) {
  return [brand.slug, brand.domain]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase().replace(/[.\-]/g, ""))
    .some((k) => HOSTED_BLOG_SUFFIXES.some((s) => k.endsWith(s)));
}

export function isExcludedFromSearch(brand: {
  slug?: string | null;
  domain?: string | null;
}): boolean {
  return isUnownedTrademarkBrand(brand) || isHostedBlogBrand(brand);
}

export type IndexableBrandRow = {
  id: number;
  slug: string;
  domain: string | null;
  date_added: Date;
};

/** Live brands with a public campaign, for the sitemap. One query, no per-brand lookups. */
export async function getIndexableBrands(): Promise<IndexableBrandRow[]> {
  const rows = await prisma.$queryRaw<IndexableBrandRow[]>`
    SELECT mu.id, mu.slug, mu.domain, mu.date_added
    FROM member_urls mu
    JOIN members m ON m.id = mu.member_id
    WHERE mu.slug IS NOT NULL AND mu.slug <> ''
      AND m.is_verified = 1
      AND (
        mu.in_vnoc = 1
        OR mu.vnoc_id IS NOT NULL
        OR (
          mu.plan_expiry > NOW()
          AND (
            SELECT pl.price
            FROM url_plan up
            JOIN plans pl ON pl.id = up.payment_id
            WHERE up.url_id = mu.id
            ORDER BY up.id DESC
            LIMIT 1
          ) > 0
        )
      )
      AND EXISTS (
        SELECT 1 FROM member_campaigns mc
        WHERE mc.url_id = mu.id AND mc.publish = 'public'
      )`;
  return rows
    .map((r) => ({ ...r, id: Number(r.id) }))
    .filter((r) => r.slug && !isExcludedFromSearch(r));
}

/** For a single brand page: should it carry noindex? */
export async function shouldNoindexBrand(brand: {
  id: number;
  slug?: string | null;
  domain?: string | null;
}): Promise<boolean> {
  if (isExcludedFromSearch(brand)) return true;
  const [live, publicCampaigns] = await Promise.all([
    isBrandGrowthEntitled(brand.id),
    prisma.member_campaigns.count({
      where: { url_id: brand.id, publish: "public" },
    }),
  ]);
  return !live || publicCampaigns === 0;
}
