import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function PublicCampaignPage({
  params,
}: {
  params: Promise<{ slug: string; campaignId: string }>;
}) {
  const { slug, campaignId } = await params;

  const brand = await prisma.member_urls.findFirst({ where: { slug } });
  if (!brand) notFound();

  const campaign = await prisma.member_campaigns.findUnique({
    where: { id: parseInt(campaignId, 10) },
  });
  if (!campaign || campaign.url_id !== brand.id) notFound();

  const participantCount = await prisma.campaign_participants.count({
    where: { campaign_id: campaign.id },
  });

  const topSharers = await prisma.participants_share.findMany({
    where: { campaign_id: campaign.id },
    orderBy: { clicks: "desc" },
    take: 10,
  });

  const topSharerIds = topSharers.map((s) => s.participant_id);
  const participants = topSharerIds.length > 0
    ? await prisma.campaign_participants.findMany({
        where: { campaign_id: campaign.id, participant_id: { in: topSharerIds } },
      })
    : [];

  const participantMap = new Map(participants.map((p) => [p.participant_id, p]));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-500">{brand.domain}</p>
          <h1 className="text-2xl font-bold mt-1">{campaign.name}</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white border p-4 text-center">
            <p className="text-2xl font-bold">{participantCount}</p>
            <p className="text-sm text-gray-500">Participants</p>
          </div>
          <div className="rounded-lg bg-white border p-4 text-center">
            <p className="text-2xl font-bold">
              {topSharers.reduce((sum, s) => sum + (s.clicks || 0), 0)}
            </p>
            <p className="text-sm text-gray-500">Total Clicks</p>
          </div>
          <div className="rounded-lg bg-white border p-4 text-center">
            <p className="text-2xl font-bold">{topSharers.length}</p>
            <p className="text-sm text-gray-500">Shares</p>
          </div>
        </div>

        {/* Widget embed */}
        <div className="rounded-lg bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Join This Campaign</h2>
          <iframe
            src={`/widget/${campaign.id}/embed`}
            className="w-full border-0"
            style={{ minHeight: 400 }}
            title="Referral Widget"
          />
        </div>

        {/* Leaderboard */}
        {topSharers.length > 0 && (
          <div className="rounded-lg bg-white border p-6">
            <h2 className="text-lg font-semibold mb-4">Top Referrers</h2>
            <div className="space-y-2">
              {topSharers.map((share, i) => {
                const p = participantMap.get(share.participant_id);
                return (
                  <div
                    key={share.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">
                        #{i + 1}
                      </span>
                      <span className="font-medium">
                        {p?.name || `Participant ${share.participant_id}`}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {share.clicks || 0} clicks
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <footer className="border-t bg-white mt-8 py-4 text-center text-sm text-gray-400">
        Powered by{" "}
        <a href="https://referrals.com" className="text-blue-600 hover:underline">
          Referrals.com
        </a>
      </footer>
    </div>
  );
}
