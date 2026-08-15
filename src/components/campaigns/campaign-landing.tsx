"use client";

import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brands/brand-logo";
import { GiftIcon } from "lucide-react";
import type { CampaignDesignStyle } from "@/lib/analysis/campaign-design";

export type LandingSnippet = { title: string; text: string };

export type CampaignLandingProps = {
  brandDomain: string;
  brandLogoUrl?: string | null;
  headline: string;
  pitch: string | null;
  landing: string | null;
  rewardLabel: string | null;
  accentFrom: string;
  accentTo: string;
  launchChannels?: string[];
  snippets?: LandingSnippet[];
  heroImageUrl?: string | null;
  designStyle?: CampaignDesignStyle | null;
  join: ReactNode;
};

export function CampaignLanding({
  brandDomain,
  brandLogoUrl,
  headline,
  pitch,
  landing,
  rewardLabel,
  accentFrom,
  accentTo,
  launchChannels,
  snippets,
  heroImageUrl,
  designStyle = "editorial",
  join,
}: CampaignLandingProps) {
  const style = designStyle || "editorial";
  const story = (
    <LandingStory
      brandDomain={brandDomain}
      brandLogoUrl={brandLogoUrl}
      headline={headline}
      pitch={pitch}
      landing={landing}
      rewardLabel={rewardLabel}
      accentFrom={accentFrom}
      launchChannels={launchChannels}
      designStyle={style}
    />
  );

  return (
    <div className={style === "warm" ? "bg-[#faf6f1] text-slate-900" : "bg-white text-slate-900"}>
      {style === "hero" && heroImageUrl ? (
        <div className="aspect-[2/1] w-full overflow-hidden bg-slate-100 sm:aspect-[21/8]">
          <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      {style === "editorial" && heroImageUrl ? (
        <div className="aspect-[21/9] w-full overflow-hidden bg-slate-100">
          <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      {style === "minimal" && heroImageUrl ? (
        <div className="mx-auto max-w-3xl px-5 pt-8 sm:px-8">
          <div className="aspect-[3/1] overflow-hidden rounded-sm bg-slate-100">
            <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      ) : null}

      {style === "warm" && heroImageUrl ? (
        <div className="mx-auto max-w-5xl px-5 pt-6 sm:px-8 sm:pt-8">
          <div className="aspect-[2/1] overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
            <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      ) : null}

      <div
        className={
          style === "minimal"
            ? "px-5 py-14 sm:px-8 sm:py-20"
            : style === "hero"
              ? "px-5 py-10 sm:px-8 sm:py-12"
              : style === "warm"
                ? "px-5 py-8 sm:px-8 sm:py-10"
                : "px-5 py-10 sm:px-8 sm:py-14"
        }
        style={
          style === "minimal"
            ? undefined
            : style === "warm"
              ? { background: `${accentFrom}0d` }
              : {
                  background: `linear-gradient(135deg, ${accentFrom}12, ${accentTo}0a 55%, #fff 100%)`,
                }
        }
      >
        {style === "hero" || style === "minimal" ? (
          <div className="mx-auto flex min-w-0 max-w-xl flex-col items-center text-center">
            {story}
            <div className="mt-6 w-full max-w-md text-left">{join}</div>
          </div>
        ) : (
          <div className="mx-auto grid min-w-0 max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            {story}
            {join}
          </div>
        )}
      </div>

      {snippets && snippets.length > 0 && (
        <div className="mx-auto grid max-w-5xl gap-3 border-t border-slate-100 bg-white p-4 sm:grid-cols-3 sm:px-8">
          {snippets.map((s) => (
            <div key={s.title} className="min-w-0 rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {s.title}
              </p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LandingStory({
  brandDomain,
  brandLogoUrl,
  headline,
  pitch,
  landing,
  rewardLabel,
  accentFrom,
  launchChannels,
  designStyle,
}: {
  brandDomain: string;
  brandLogoUrl?: string | null;
  headline: string;
  pitch: string | null;
  landing: string | null;
  rewardLabel: string | null;
  accentFrom: string;
  launchChannels?: string[];
  designStyle: CampaignDesignStyle;
}) {
  const centered = designStyle === "hero" || designStyle === "minimal";
  return (
    <div className={`min-w-0 ${centered ? "flex flex-col items-center" : ""}`}>
      <div
        className={`mb-4 flex items-center justify-center overflow-hidden border border-white bg-white p-2 shadow-sm ${
          designStyle === "minimal"
            ? "size-11 rounded-md"
            : designStyle === "warm"
              ? "size-14 rounded-full"
              : "size-14 rounded-2xl"
        }`}
      >
        <BrandLogo
          domain={brandDomain}
          logoUrl={brandLogoUrl}
          imgClassName="h-full w-full object-contain"
          fallbackClassName="flex h-full w-full items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-400"
        />
      </div>
      <p
        className={`text-[11px] font-bold uppercase tracking-wider text-slate-500 ${
          designStyle === "minimal" ? "tracking-[0.2em]" : ""
        }`}
      >
        {brandDomain}
      </p>
      <h1
        className={
          designStyle === "hero"
            ? "mt-2 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl"
            : designStyle === "minimal"
              ? "mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl"
              : "mt-1.5 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl"
        }
      >
        {headline}
      </h1>
      <p
        className={`mt-3 text-sm leading-relaxed text-slate-600 ${
          centered ? "max-w-lg" : "max-w-xl"
        }`}
      >
        {landing || pitch || "Share your link and earn rewards when friends join."}
      </p>
      {rewardLabel && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm">
          <GiftIcon className="size-4" style={{ color: accentFrom }} />
          {rewardLabel}
        </p>
      )}
      {launchChannels?.length ? (
        <div className={`mt-4 flex flex-wrap gap-1.5 ${centered ? "justify-center" : ""}`}>
          {launchChannels.map((ch) => (
            <span
              key={ch}
              className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
            >
              {ch}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CampaignJoinCard({
  campaignId,
  headline,
  pitch,
  buttonText,
  accentFrom,
  accentTo,
  mode = "live",
}: {
  campaignId?: number;
  headline: string;
  pitch: string | null;
  buttonText: string;
  accentFrom: string;
  accentTo: string;
  mode?: "preview" | "live";
}) {
  const preview = mode === "preview";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (preview || !campaignId) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/widget/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, name, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.shareUrl) {
        setError(data.error || "Could not join. Try again.");
        return;
      }
      setShareUrl(data.shareUrl);
    } catch {
      setError("Could not join. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md">
      <p className="text-center text-lg font-bold text-slate-900">{headline}</p>
      {pitch && (
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
          {pitch}
        </p>
      )}
      {shareUrl ? (
        <div className="mt-4 space-y-2">
          <p className="text-center text-sm font-medium text-slate-700">
            Your referral link is ready.
          </p>
          <input
            readOnly
            value={shareUrl}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
          />
        </div>
      ) : (
        <form className="mt-4 space-y-2" onSubmit={onSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={preview ? "" : name}
            onChange={(e) => setName(e.target.value)}
            disabled={preview || loading}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 disabled:text-slate-400"
          />
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={preview ? "" : email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={preview || loading}
            required={!preview}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 disabled:text-slate-400"
          />
          <button
            type={preview ? "button" : "submit"}
            disabled={preview || loading}
            className="w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white disabled:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
            }}
          >
            {loading ? "Joining…" : buttonText}
          </button>
        </form>
      )}
      {error && (
        <p className="mt-3 text-center text-[11px] text-red-500">{error}</p>
      )}
      <p className="mt-3 text-center text-[11px] text-slate-400">
        {preview
          ? "Preview — form does not submit here"
          : shareUrl
            ? "Copy your link and start sharing"
            : "Get your personal referral link"}
      </p>
    </div>
  );
}
