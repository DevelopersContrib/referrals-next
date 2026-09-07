"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Rocket,
  TrendingUp,
  Heart,
  ChevronDown,
  Check,
  Loader2,
  Sparkles,
  Target,
  Lightbulb,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brands/brand-logo";
import type { AnalysisStatus, CampaignView } from "./analysis-types";

const LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

// ── Animated circular gauge (pure SVG) ──
function ScoreGauge({
  value,
  label,
  color,
  size = 68,
}: {
  value: number;
  label: string;
  color: string;
  size?: number;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, shown)) / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f3" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-900">
          {Math.round(shown)}
        </span>
      </div>
      <span className="mt-1.5 text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
}

const KIND_META: Record<
  CampaignView["kind"],
  { title: string; icon: LucideIcon; from: string; to: string; accent: string }
> = {
  fast_growth: { title: "Fast Growth", icon: Rocket, from: "#FF5C62", to: "#ff7a54", accent: "text-[#FF5C62]" },
  revenue: { title: "Revenue Growth", icon: TrendingUp, from: "#10b981", to: "#059669", accent: "text-emerald-600" },
  loyalty: { title: "Customer Loyalty", icon: Heart, from: "#926efb", to: "#7c3aed", accent: "text-violet-600" },
};

export function BrandResults({ status }: { status: AnalysisStatus }) {
  const router = useRouter();
  const [launchingId, setLaunchingId] = useState<number | null>(null);
  const [launchedId, setLaunchedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const name = status.vnoc?.name || status.crawl?.name || status.domain;
  const logo = status.vnoc?.logoUrl || status.crawl?.logoUrl || null;
  const favicon = status.crawl?.faviconUrl || null;
  const intel = status.intelligence;
  const scores = status.scores;

  const overall = scores.overall ?? 0;

  const subScores = useMemo(
    () => [
      { label: "Website", value: scores.website ?? 0, color: "#FF5C62" },
      { label: "Social", value: scores.social ?? 0, color: "#926efb" },
      { label: "Referral", value: scores.referral ?? 0, color: "#10b981" },
    ],
    [scores]
  );

  async function launch(c: CampaignView) {
    if (launchingId) return;
    setLaunchingId(c.id);
    setError(null);
    try {
      const res = await fetch(`/api/brands/analyze/${status.jobId}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId: c.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not launch this campaign. Please try again.");
        setLaunchingId(null);
        return;
      }
      setLaunchedId(c.id);
      // Campaign overview: live referral URL + stats (impressions prove tracking)
      setTimeout(() => {
        router.push(`/brands/${data.brandId}/campaigns/${data.campaignId}`);
      }, 600);
    } catch {
      setError("Something went wrong launching the campaign.");
      setLaunchingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center">
        <Image src={LOGO_URL} alt="Referrals.com" width={128} height={40} priority unoptimized />
      </Link>

      {/* Header + health */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <Check className="h-3.5 w-3.5" /> Analysis complete
        </div>
        <div className="flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-100/60 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-2">
              <BrandLogo
                domain={status.domain}
                logoUrl={logo}
                faviconUrl={favicon}
                imgClassName="h-full w-full object-contain"
                fallbackClassName="flex h-full w-full items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-400"
              />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "var(--font-dosis), sans-serif" }}
              >
                {name}
              </h1>
              <p className="text-sm text-gray-500">
                {intel?.industry || status.domain}
                {status.inVnoc && (
                  <span className="ml-2 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">
                    Verified brand
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ScoreGauge value={overall} label="Brand Health" color="#FF5C62" size={84} />
            <div className="hidden gap-5 sm:flex">
              {subScores.map((s) => (
                <ScoreGauge key={s.label} value={s.value} label={s.label} color={s.color} />
              ))}
            </div>
          </div>
        </div>
        {/* sub scores on mobile */}
        <div className="mt-4 flex justify-around sm:hidden">
          {subScores.map((s) => (
            <ScoreGauge key={s.label} value={s.value} label={s.label} color={s.color} />
          ))}
        </div>
      </div>

      {/* Brand intelligence */}
      {intel && (
        <div className="mt-8 grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
          {intel.summary && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 md:col-span-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Sparkles className="h-4 w-4 text-[#FF5C62]" /> Brand summary
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{intel.summary}</p>
              {intel.usp && (
                <p className="mt-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">USP: </span>
                  {intel.usp}
                </p>
              )}
            </div>
          )}
          <InfoList icon={Target} title="Ideal customer" items={intel.icp ? [intel.icp] : []} />
          <InfoList icon={ShieldCheck} title="Advantages" items={intel.advantages} />
          <InfoList icon={Lightbulb} title="Growth opportunities" items={intel.opportunities} />
        </div>
      )}

      {/* Campaigns */}
      <div className="mt-10">
        <h2
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-dosis), sans-serif" }}
        >
          Your AI-designed referral campaigns
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Pick one to launch instantly. You can fine-tune everything afterward.
        </p>

        {error && (
          <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {status.campaigns.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
            Design a referral campaign with AI when you&apos;re ready.{" "}
            {status.brandId ? (
              <Link
                href={`/brands/${status.brandId}/campaigns/ai`}
                className="font-medium text-[#FF5C62] underline"
              >
                Open the AI campaign builder
              </Link>
            ) : (
              <button
                onClick={() => router.push("/dashboard")}
                className="font-medium text-[#FF5C62] underline"
              >
                Go to your dashboard
              </button>
            )}
            .
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {status.campaigns.map((c, i) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                index={i}
                launching={launchingId === c.id}
                launched={launchedId === c.id}
                disabled={launchingId !== null && launchingId !== c.id}
                onLaunch={() => launch(c)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoList({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Icon className="h-4 w-4 text-gray-400" /> {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, 4).map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-600">
            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gray-300" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CampaignCard({
  campaign,
  index,
  launching,
  launched,
  disabled,
  onLaunch,
}: {
  campaign: CampaignView;
  index: number;
  launching: boolean;
  launched: boolean;
  disabled: boolean;
  onLaunch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[campaign.kind];
  const Icon = meta.icon;
  const p = campaign.payload || {};

  return (
    <div
      style={{ animationDelay: `${index * 100}ms` }}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="p-5" style={{ background: `linear-gradient(135deg, ${meta.from}12, ${meta.to}08)` }}>
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className={`text-xs font-bold uppercase tracking-wide ${meta.accent}`}>{meta.title}</span>
        </div>
        <h3 className="mt-3 text-base font-bold leading-snug text-gray-900">
          {campaign.headline || campaign.name}
        </h3>
        {campaign.description && (
          <p className="mt-1.5 text-sm text-gray-600">{campaign.description}</p>
        )}
      </div>

      {/* Predictions */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-y border-gray-100 text-center">
        <Metric label="Conversion" value={campaign.predictedConversion} />
        <Metric label="Referrals" value={campaign.predictedReferrals} />
        <Metric label="Est. ROI" value={campaign.estimatedRoi} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium capitalize">
            {campaign.rewardType || "reward"}
          </span>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
          aria-expanded={open}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "Hide" : "Preview"} the copy
        </button>

        {open && (
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
            {p.widgetCopy && <Snippet title="Widget" text={p.widgetCopy} />}
            {p.emailSequence?.[0] && <Snippet title="Email" text={p.emailSequence[0]} />}
            {p.socialPosts?.[0] && <Snippet title="Social" text={p.socialPosts[0]} />}
            {p.sms && <Snippet title="SMS" text={p.sms} />}
            {p.launchChannels?.length ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Launch on</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.launchChannels.map((ch) => (
                    <span key={ch} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-auto pt-5">
          <Button
            onClick={onLaunch}
            disabled={disabled || launching || launched}
            className="w-full font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
          >
            {launched ? (
              <>
                <Check className="h-4 w-4" /> Launched
              </>
            ) : launching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Launching…
              </>
            ) : (
              "Launch this campaign"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="px-2 py-3">
      <p className="text-sm font-bold text-gray-900">{value || "—"}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  );
}

function Snippet({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-gray-600">{text}</p>
    </div>
  );
}
