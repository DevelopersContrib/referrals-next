import { prisma } from "@/lib/prisma";

export type SocialProofStats = {
  recentSignups: number;
  totalShares: number;
  brands: number;
  weeklyCampaigns: number;
};

const fallback: SocialProofStats = {
  recentSignups: 0,
  totalShares: 0,
  brands: 0,
  weeklyCampaigns: 0,
};

/**
 * Live activity numbers shared by the homepage and auth pages.
 * A real zero stays zero — fallbacks apply only when the database is unreachable,
 * so the homepage and signup page never disagree because one side invented a count.
 */
export async function getSocialProofStats(): Promise<SocialProofStats> {
  try {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyMinsAgo = new Date(now - 30 * 60 * 1000);

    const [recentSignups, totalShares, brands, weeklyCampaigns] = await Promise.all([
      prisma.members.count({ where: { date_signedup: { gte: thirtyMinsAgo } } }),
      prisma.participants_share.count(),
      prisma.member_urls.count(),
      prisma.member_campaigns.count({ where: { date_added: { gte: weekAgo } } }),
    ]);

    return { recentSignups, totalShares, brands, weeklyCampaigns };
  } catch {
    return fallback;
  }
}
