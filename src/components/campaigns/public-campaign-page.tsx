import type { Metadata } from "next";
import type { PublicCampaignViewPayload } from "@/lib/public-campaign-server";

export function buildPublicCampaignMetadata(
  data: PublicCampaignViewPayload
): Metadata {
  const { brand, campaign } = data;
  const title = campaign.name;
  const description =
    brand.domain
      ? `Join the referral program on ${brand.domain}.`
      : "Join this referral campaign on Referrals.com.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export function PublicCampaignPageView({ data }: { data: PublicCampaignViewPayload }) {
  const { brand, campaign, participantCount, topSharers, participantMap, totalClicks } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50/30 text-slate-900">
      <header className="border-b border-rose-100/80 bg-gradient-to-r from-white via-rose-50/40 to-violet-50/30">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5C62]">
            {brand.domain}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            {campaign.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Share your link, track progress, and unlock rewards when friends complete the goal.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#FF5C62] tabular-nums sm:text-3xl">
              {participantCount}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 sm:text-sm">
              Participants
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#926efb] tabular-nums sm:text-3xl">
              {totalClicks}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 sm:text-sm">
              Total clicks
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-800 tabular-nums sm:text-3xl">
              {topSharers.length}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 sm:text-sm">
              Active sharers
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md">
          <div className="border-b border-slate-100 bg-gradient-to-r from-rose-50/50 to-violet-50/40 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Join this campaign</h2>
            <p className="mt-1 text-sm text-slate-600">
              Complete the form below to get your personal referral link.
            </p>
          </div>
          <div className="p-3 sm:p-5">
            <iframe
              src={`/widget/${campaign.id}/embed`}
              className="w-full rounded-xl border border-slate-100 bg-slate-50/50"
              style={{ minHeight: 420 }}
              title="Referral program widget"
              allow="clipboard-write; clipboard-read"
            />
          </div>
        </section>

        {topSharers.length > 0 ? (
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Top referrers</h2>
            <p className="mt-1 text-sm text-slate-600">Leaderboard by tracked link clicks.</p>
            <ul className="mt-4 space-y-2">
              {topSharers.map((share, i) => {
                const p = participantMap.get(share.participant_id);
                return (
                  <li
                    key={share.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#926efb] shadow-sm">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium text-slate-800">
                        {p?.name || `Participant ${share.participant_id}`}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[#FF5C62]">
                      {share.clicks || 0} clicks
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-5 py-10 text-center text-sm text-slate-500">
            Referral activity will appear here once participants start sharing.
          </section>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200/80 bg-white/90 py-6 text-center text-sm text-slate-500">
        <p>
          <span className="font-medium text-slate-700">{brand.domain}</span>
          <span className="mx-2 text-slate-300" aria-hidden>
            |
          </span>
          <span>Powered by </span>
          <a
            href="https://referrals.com"
            className="font-medium text-[#FF5C62] underline-offset-2 hover:underline"
          >
            Referrals.com
          </a>
        </p>
      </footer>
    </div>
  );
}
