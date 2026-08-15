import Link from "next/link";
import { IntegrationsEmbedLink } from "@/components/campaigns/campaign-tabs";
import {
  CampaignJoinCard,
  CampaignLanding,
} from "@/components/campaigns/campaign-landing";
import {
  kindLook,
  readSuggestionPayload,
  type SuggestionPayload,
} from "@/lib/analysis/apply-campaign-suggestion";
import { ExternalLinkIcon, PuzzleIcon } from "lucide-react";

type PreviewProps = {
  brandDomain: string;
  brandLogoUrl?: string | null;
  headline: string;
  pitch: string | null;
  landing: string | null;
  buttonText: string;
  accentFrom: string;
  accentTo: string;
  rewardLabel: string | null;
  publicPageUrl: string;
  widgetUrl: string;
  payload: SuggestionPayload;
};

export function CampaignDashboardPreview({
  brandDomain,
  brandLogoUrl,
  headline,
  pitch,
  landing,
  buttonText,
  accentFrom,
  accentTo,
  rewardLabel,
  publicPageUrl,
  widgetUrl,
  payload,
}: PreviewProps) {
  const host = publicPageUrl.replace(/^https?:\/\//, "");
  const snippets = [
    payload.emailSequence?.[0] && { title: "Email", text: payload.emailSequence[0] },
    payload.socialPosts?.[0] && { title: "Social", text: payload.socialPosts[0] },
    payload.sms && { title: "SMS", text: payload.sms },
  ].filter(Boolean) as { title: string; text: string }[];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Campaign preview</p>
          <p className="text-xs text-gray-500">
            What visitors see on your public page — not just the join form.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IntegrationsEmbedLink className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand underline-offset-2 hover:underline">
            <PuzzleIcon className="size-3.5" />
            Install / embed
          </IntegrationsEmbedLink>
          <Link
            href={publicPageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand underline-offset-2 hover:underline"
          >
            Open public page
            <ExternalLinkIcon className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-b from-slate-100 to-slate-50 p-3 sm:p-5">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
            <span className="size-2 rounded-full bg-[#ff5f57]" />
            <span className="size-2 rounded-full bg-[#febc2e]" />
            <span className="size-2 rounded-full bg-[#28c840]" />
            <p className="ml-2 min-w-0 truncate rounded-md bg-white px-2 py-0.5 font-mono text-[11px] text-slate-500">
              {host}
            </p>
          </div>

          <CampaignLanding
            brandDomain={brandDomain}
            brandLogoUrl={brandLogoUrl}
            headline={headline}
            pitch={pitch}
            landing={landing}
            rewardLabel={rewardLabel}
            accentFrom={accentFrom}
            accentTo={accentTo}
            launchChannels={payload.launchChannels}
            snippets={snippets}
            heroImageUrl={payload.bannerImageUrl}
            designStyle={payload.designStyle}
            join={
              <CampaignJoinCard
                headline={headline}
                pitch={pitch}
                buttonText={buttonText}
                accentFrom={accentFrom}
                accentTo={accentTo}
                mode="preview"
              />
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-5 py-3">
        <p className="text-xs text-gray-500">
          Need to test signup? Open the live widget — it records a real impression.
        </p>
        <Link
          href={widgetUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-brand underline-offset-2 hover:underline"
        >
          Open live widget
        </Link>
      </div>
    </section>
  );
}

export function previewFromRecords(input: {
  kind?: string | null;
  headline: string;
  pitch: string | null;
  widget: {
    body_text?: string | null;
    button_text?: string | null;
    join_button_text?: string | null;
    banner_image_url?: string | null;
  } | null;
  suggestionPayload?: unknown;
  rewardLabel: string | null;
  brandDomain: string;
  brandLogoUrl?: string | null;
  publicPageUrl: string;
  widgetUrl: string;
}) {
  const look = kindLook(input.kind);
  const payload = readSuggestionPayload(input.suggestionPayload);
  return {
    brandDomain: input.brandDomain,
    brandLogoUrl: input.brandLogoUrl,
    headline: input.headline,
    pitch: input.pitch,
    landing: input.widget?.body_text || payload.landingCopy || null,
    buttonText:
      input.widget?.join_button_text ||
      input.widget?.button_text ||
      look.cta,
    accentFrom: look.from,
    accentTo: look.to,
    rewardLabel: input.rewardLabel,
    publicPageUrl: input.publicPageUrl,
    widgetUrl: input.widgetUrl,
    payload: {
      ...payload,
      bannerImageUrl: payload.bannerImageUrl || input.widget?.banner_image_url || undefined,
    },
  } satisfies PreviewProps;
}
