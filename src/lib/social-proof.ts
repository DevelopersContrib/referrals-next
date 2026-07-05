import { prisma } from "@/lib/prisma";

export type SocialProofStats = {
  recentSignups: number;
  totalShares: number;
  brands: number;
};

const fallback: SocialProofStats = {
  recentSignups: 17,
  totalShares: 21844,
  brands: 2481,
};

/**
 * Light-weight social-proof numbers for auth / marketing pages.
 * Always resolves (falls back to sensible defaults if the DB is unavailable).
 */
export async function getSocialProofStats(): Promise<SocialProofStats> {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [recentSignups, totalShares, brands] = await Promise.all([
      prisma.members.count({ where: { date_signedup: { gte: thirtyMinsAgo } } }),
      prisma.participants_share.count(),
      prisma.member_urls.count(),
    ]);

    return {
      recentSignups: recentSignups || fallback.recentSignups,
      totalShares: totalShares || fallback.totalShares,
      brands: brands || fallback.brands,
    };
  } catch {
    return fallback;
  }
}
