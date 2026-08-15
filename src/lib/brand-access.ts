import { prisma } from "@/lib/prisma";
import { memberIdIsPlatformAdmin } from "@/lib/platform-admin";

export async function userCanAccessBrand(
  brandId: number,
  memberId: number,
  isAdminFromSession?: boolean
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
  isAdminFromSession?: boolean
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
  isAdminFromSession?: boolean
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
  isAdminFromSession?: boolean
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
    isAdminFromSession
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

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

/** Public URL slug from a domain: blacksesameph.com → blacksesameph-com */
export function slugifyDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function uniqueBrandSlug(base: string, excludeId?: number): Promise<string> {
  const root = (slugifyDomain(base) || slugify(base) || "brand").slice(0, 80);
  let candidate = root;
  let n = 2;
  for (;;) {
    const existing = await prisma.member_urls.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${root}-${n}`.slice(0, 100);
    n += 1;
  }
}
