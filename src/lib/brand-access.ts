import { prisma } from "@/lib/prisma";
import { memberIdIsPlatformAdmin } from "@/lib/platform-admin";
import {
  normalizeSlug,
  publicBrandPath,
  slugFromWebsite,
  slugIssue,
  slugIssueMessage,
  type SlugCheckResult,
} from "@/lib/brand-slug";

export {
  normalizeSlug,
  publicBrandPath,
  slugFromWebsite,
  slugIssue,
  slugIssueMessage,
  slugify,
  slugifyDomain,
} from "@/lib/brand-slug";
export type { SlugCheckResult, SlugIssue, SlugReason } from "@/lib/brand-slug";

export async function userCanAccessBrand(
  brandId: number,
  memberId: number,
  isAdminFromSession?: boolean,
): Promise<boolean> {
  if (isAdminFromSession) return true;
  if (await memberIdIsPlatformAdmin(memberId)) return true;

  const brand = await prisma.member_urls.findFirst({
    where: { id: brandId, member_id: memberId },
    select: { id: true },
  });
  return Boolean(brand);
}

export async function getBrandIfAccessible(
  brandId: number,
  memberId: number,
  isAdminFromSession?: boolean,
) {
  const isAdmin =
    Boolean(isAdminFromSession) || (await memberIdIsPlatformAdmin(memberId));

  if (isAdmin) {
    return prisma.member_urls.findUnique({ where: { id: brandId } });
  }

  return prisma.member_urls.findFirst({
    where: { id: brandId, member_id: memberId },
  });
}

export async function getCampaignIfAccessible(
  campaignId: number,
  brandId: number,
  memberId: number,
  isAdminFromSession?: boolean,
) {
  const isAdmin =
    Boolean(isAdminFromSession) || (await memberIdIsPlatformAdmin(memberId));

  if (isAdmin) {
    return prisma.member_campaigns.findFirst({
      where: { id: campaignId, url_id: brandId },
    });
  }

  return prisma.member_campaigns.findFirst({
    where: { id: campaignId, url_id: brandId, member_id: memberId },
  });
}

/** Same access rules as dashboard pages; resolves brand from the campaign row. */
export async function getCampaignByIdIfAccessible(
  campaignId: number,
  memberId: number,
  isAdminFromSession?: boolean,
) {
  const row = await prisma.member_campaigns.findUnique({
    where: { id: campaignId },
    select: { url_id: true },
  });
  if (!row) return null;

  return getCampaignIfAccessible(
    campaignId,
    row.url_id,
    memberId,
    isAdminFromSession,
  );
}

export function extractDomainFromUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withProtocol).hostname.replace(/^www\./i, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0];
  }
}

/** The brand currently holding `slug`, ignoring `excludeId`. */
export async function findBrandBySlug(slug: string, excludeId?: number) {
  if (!slug) return null;
  return prisma.member_urls.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, member_id: true, domain: true },
  });
}

/**
 * A root that is safe to suffix: reserved, numeric and too-short roots get a
 * qualifier so `uniqueBrandSlug` never hands back an unusable slug.
 */
function safeSlugRoot(base: string): string {
  const root = normalizeSlug(base) || "brand";
  const issue = slugIssue(root);
  if (issue === "reserved" || issue === "numeric" || issue === "too-short") {
    return normalizeSlug(`${root}-brand`) || "brand";
  }
  return root;
}

/** First free slug in the `root`, `root-2`, `root-3`… sequence. */
export async function uniqueBrandSlug(
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = safeSlugRoot(base);
  let candidate = root;
  let n = 2;
  for (;;) {
    const existing = await findBrandBySlug(candidate, excludeId);
    if (!existing) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
}

/**
 * Availability of a slug plus the next free alternative — the single source of
 * truth behind `/api/brands/check-slug` and every create/update guard.
 */
export async function checkBrandSlug(input: {
  slug?: string | null;
  /** Website or domain used to derive the slug when one is not supplied. */
  website?: string | null;
  excludeBrandId?: number;
}): Promise<SlugCheckResult> {
  const fromWebsite = input.website ? slugFromWebsite(input.website) : "";
  const slug = normalizeSlug(input.slug ?? "") || fromWebsite;

  const issue = slugIssue(slug);
  if (issue) {
    const suggestion =
      issue === "empty"
        ? null
        : await uniqueBrandSlug(slug || fromWebsite, input.excludeBrandId);
    return {
      slug,
      available: false,
      reason: issue,
      message: slugIssueMessage(issue),
      suggestion,
      publicPath: publicBrandPath(suggestion ?? slug),
    };
  }

  const taken = await findBrandBySlug(slug, input.excludeBrandId);
  if (taken) {
    const suggestion = await uniqueBrandSlug(slug, input.excludeBrandId);
    return {
      slug,
      available: false,
      reason: "taken",
      message: `${slug} is already taken.`,
      suggestion,
      publicPath: publicBrandPath(suggestion),
    };
  }

  return {
    slug,
    available: true,
    reason: "ok",
    message: `${slug} is available.`,
    suggestion: null,
    publicPath: publicBrandPath(slug),
  };
}

const CLAIM_ATTEMPTS = 5;

/**
 * Give a freshly created brand a slug nobody else holds.
 *
 * `member_urls.slug` has no unique index, so two concurrent creates can both
 * pass the availability check. After writing we re-read: if an older row holds
 * the same slug the younger row yields and takes the next candidate. The id
 * suffix is the last resort and is unique by construction.
 */
export async function claimBrandSlug(
  brandId: number,
  requested: string | null | undefined,
  fallback: string,
): Promise<string> {
  const normalized = normalizeSlug(requested ?? "");
  let preferred = normalized && !slugIssue(normalized) ? normalized : "";

  for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt += 1) {
    const slug = await uniqueBrandSlug(preferred || fallback, brandId);
    await prisma.member_urls.update({
      where: { id: brandId },
      data: { slug },
    });

    const older = await prisma.member_urls.findFirst({
      where: { slug, id: { lt: brandId } },
      select: { id: true },
    });
    if (!older) return slug;

    // Lost the race — the older brand keeps the slug.
    preferred = "";
  }

  const slug = `${safeSlugRoot(fallback).slice(0, 70)}-${brandId}`;
  await prisma.member_urls.update({ where: { id: brandId }, data: { slug } });
  return slug;
}
