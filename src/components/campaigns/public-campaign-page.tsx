import type { Metadata } from "next";
import type { PublicCampaignViewPayload } from "@/lib/public-campaign-server";
import {
  CampaignJoinCard,
  CampaignLanding,
} from "@/components/campaigns/campaign-landing";

export function buildPublicCampaignMetadata(
  data: PublicCampaignViewPayload
): Metadata {
  const { brand, campaign } = data;
  const title = campaign.headline || campaign.name;
  const description =
    campaign.pitch ||
    (brand.domain
      ? `Join the referral program on ${brand.domain}.`
      : "Join this referral campaign on Referrals.com.");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(data.heroImageUrl ? { images: [{ url: data.heroImageUrl }] } : {}),
    },
  };
}

export function PublicCampaignPageView({
  data,
}: {
  data: PublicCampaignViewPayload;
}) {
  const {
    brand,
    campaign,
    participantCount,
    topSharers,
    participantMap,
    totalClicks,
    showBranding,
    accentFrom,
    accentTo,
    rewardLabel,
    buttonText,
    launchChannels,
    snippets,
    heroImageUrl,
    designStyle,
  } = data;
  const headline = campaign.headline || campaign.name;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <CampaignLanding
        brandDomain={brand.domain}
        brandLogoUrl={brand.logo_url}
        headline={headline}
        pitch={campaign.pitch}
        landing={campaign.landing}
        rewardLabel={rewardLabel}
        accentFrom={accentFrom}
        accentTo={accentTo}
        launchChannels={launchChannels}
        snippets={snippets}
        heroImageUrl={heroImageUrl}
        designStyle={designStyle}
        join={
          <CampaignJoinCard
            campaignId={campaign.id}
            headline={headline}
            pitch={campaign.pitch}
            buttonText={buttonText}
            accentFrom={accentFrom}
            accentTo={accentTo}
            mode="live"
          />
        }
      />

      <main className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-sm">
            <p
              className="text-2xl font-bold tabular-nums sm:text-3xl"
              style={{ color: accentFrom }}
            >
              {participantCount}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 sm:text-sm">
              Participants
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-800 tabular-nums sm:text-3xl">
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

        {topSharers.length > 0 ? (
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Top referrers
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Leaderboard by tracked link clicks.
            </p>
            <ul className="mt-4 space-y-2">
              {topSharers.map((share, i) => {
                const p = participantMap.get(share.participant_id);
                return (
                  <li
                    key={share.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium text-slate-800">
                        {p?.name || `Participant ${share.participant_id}`}
                      </span>
                    </div>
                    <span
                      className="shrink-0 text-sm font-semibold"
                      style={{ color: accentFrom }}
                    >
                      {share.clicks || 0} clicks
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-10 text-center text-sm text-slate-500">
            Referral activity will appear here once participants start sharing.
          </section>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-sm text-slate-500">
        <p>
          <span className="font-medium text-slate-700">{brand.domain}</span>
          {showBranding !== false && (
            <>
              <span className="mx-2 text-slate-300" aria-hidden>
                |
              </span>
              <span>Powered by </span>
              <a
                href="https://referrals.com/?utm_source=campaign&utm_medium=powered_by&utm_campaign=public_campaign"
                className="font-medium underline-offset-2 hover:underline"
                style={{ color: accentFrom }}
              >
                Referrals.com
              </a>
            </>
          )}
        </p>
      </footer>
    </div>
  );
}
