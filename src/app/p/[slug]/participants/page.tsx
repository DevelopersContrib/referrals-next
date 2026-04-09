import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.member_urls.findFirst({
    where: { slug },
  });

  if (!brand) {
    return { title: "Participants | Referrals.com" };
  }

  return {
    title: `Top Referrers - ${brand.domain} | Referrals.com`,
    description: `View the top referrers and leaderboard for ${brand.domain} campaigns on Referrals.com.`,
  };
}

export default async function PublicParticipantsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Find brand by slug
  const brand = await prisma.member_urls.findFirst({
    where: { slug },
  });

  if (!brand) {
    notFound();
  }

  // Get all campaigns for this brand
  const campaigns = await prisma.member_campaigns.findMany({
    where: { url_id: brand.id },
    select: { id: true, name: true },
  });

  const campaignIds = campaigns.map((c) => c.id);

  if (campaignIds.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-white">{brand.domain}</h1>
        <p className="mt-4 text-gray-400">
          No active campaigns for this brand yet.
        </p>
      </div>
    );
  }

  // Get participants with their share counts for leaderboard
  const participants = await prisma.campaign_participants.findMany({
    where: { campaign_id: { in: campaignIds } },
    orderBy: { date_signedup: "asc" },
    take: 100,
  });

  // Get share counts per participant
  const shares = await prisma.participants_share.groupBy({
    by: ["participant_id"],
    where: { campaign_id: { in: campaignIds } },
    _count: { id: true },
    _sum: { clicks: true },
  });

  const shareMap = new Map(
    shares.map((s) => [
      s.participant_id,
      { shares: s._count.id, clicks: s._sum.clicks || 0 },
    ])
  );

  // Get invited counts per participant
  const invites = await prisma.participants_invited_emails.groupBy({
    by: ["participant_id"],
    where: { campaign_id: { in: campaignIds } },
    _count: { id: true },
  });

  const inviteMap = new Map(
    invites.map((i) => [i.participant_id, i._count.id])
  );

  // Build leaderboard sorted by total activity
  const leaderboard = participants
    .map((p) => {
      const shareData = shareMap.get(p.id) || { shares: 0, clicks: 0 };
      const inviteCount = inviteMap.get(p.id) || 0;
      const score = shareData.shares * 2 + inviteCount * 3 + shareData.clicks;
      return {
        id: p.id,
        name: p.name || "Anonymous",
        photo: p.photo,
        shares: shareData.shares,
        clicks: shareData.clicks,
        invites: inviteCount,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Top Referrers
        </h1>
        <p className="mt-2 text-gray-400">
          Leaderboard for{" "}
          <span className="font-medium text-white">{brand.domain}</span>
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            No participants yet. Be the first to join!
          </p>
        </div>
      ) : (
        <div className="mt-10">
          {/* Top 3 podium */}
          {leaderboard.length >= 3 && (
            <div className="mb-10 flex items-end justify-center gap-4">
              {[1, 0, 2].map((idx) => {
                const person = leaderboard[idx];
                if (!person) return null;
                const isFirst = idx === 0;
                return (
                  <div
                    key={person.id}
                    className={`flex flex-col items-center ${isFirst ? "mb-4" : ""}`}
                  >
                    <div
                      className={`flex items-center justify-center rounded-full bg-[#292A2D] font-bold text-white ${
                        isFirst
                          ? "h-20 w-20 text-2xl ring-4 ring-yellow-400/50"
                          : "h-16 w-16 text-lg ring-2 ring-white/10"
                      }`}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">
                      {person.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {person.score} pts
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        idx === 0
                          ? "bg-yellow-400/10 text-yellow-400"
                          : idx === 1
                            ? "bg-gray-400/10 text-gray-300"
                            : "bg-orange-400/10 text-orange-400"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full leaderboard table */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#292A2D]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4 text-center">Shares</th>
                  <th className="px-6 py-4 text-center">Invites</th>
                  <th className="px-6 py-4 text-center">Clicks</th>
                  <th className="px-6 py-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((person, index) => (
                  <tr
                    key={person.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-400/10 text-yellow-400"
                            : index === 1
                              ? "bg-gray-400/10 text-gray-300"
                              : index === 2
                                ? "bg-orange-400/10 text-orange-400"
                                : "text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#212529] text-sm font-medium text-white">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {person.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center text-sm text-gray-300">
                      {person.shares}
                    </td>
                    <td className="px-6 py-3 text-center text-sm text-gray-300">
                      {person.invites}
                    </td>
                    <td className="px-6 py-3 text-center text-sm text-gray-300">
                      {person.clicks}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-semibold text-[#FF5C62]">
                        {person.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
