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
