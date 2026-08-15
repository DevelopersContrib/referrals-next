"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  TrendingUp,
  Heart,
  ChevronDown,
  Check,
  Loader2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisStatus, CampaignView } from "@/components/onboarding/analysis-types";
import { AiCampaignBrief, type CampaignBriefChoice } from "@/components/campaigns/ai-campaign-brief";
import { DESIGN_META, isCampaignDesign } from "@/lib/analysis/campaign-design";

const KIND_META: Record<
  CampaignView["kind"],
  { title: string; icon: LucideIcon; from: string; to: string; accent: string }
> = {
  fast_growth: { title: "Fast Growth", icon: Rocket, from: "#FF5C62", to: "#ff7a54", accent: "text-[#FF5C62]" },
  revenue: { title: "Revenue Growth", icon: TrendingUp, from: "#10b981", to: "#059669", accent: "text-emerald-600" },
  loyalty: { title: "Customer Loyalty", icon: Heart, from: "#926efb", to: "#7c3aed", accent: "text-violet-600" },
};

export function AiCampaignPicker({
  status: statusProp,
  brandId,
  brandUrl,
  initialJobId,
  hideHeading = false,
  askBrief = false,
  brandColors,
}: {
  status?: AnalysisStatus;
  brandId?: string;
  brandUrl?: string | null;
  initialJobId?: number | null;
  hideHeading?: boolean;
  askBrief?: boolean;
  brandColors?: unknown;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AnalysisStatus | null>(statusProp ?? null);
  const [jobId, setJobId] = useState<number | null>(statusProp?.jobId ?? initialJobId ?? null);
  const [loading, setLoading] = useState(!statusProp && Boolean(initialJobId || brandId));
  const [error, setError] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<number | null>(null);
  const [launchedId, setLaunchedId] = useState<number | null>(null);
  const [briefDone, setBriefDone] = useState(!askBrief);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const poll = useCallback(async (id: number) => {
    if (stoppedRef.current) return;
    try {
      const res = await fetch(`/api/brands/analyze/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as AnalysisStatus;
        setStatus(data);
        setLoading(false);
        if (data.status === "done" || data.status === "failed") return;
      }
    } catch {
      /* keep polling */
    }
    pollRef.current = setTimeout(() => poll(id), 1600);
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    return () => {
      stoppedRef.current = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (statusProp) {
      setStatus(statusProp);
      setJobId(statusProp.jobId);
      setLoading(false);
      return;
    }

    async function start() {
      if (initialJobId) {
        setJobId(initialJobId);
        setLoading(true);
        void poll(initialJobId);
        return;
      }
      if (!brandId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/brands/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId: Number(brandId), url: brandUrl || undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not design campaigns for this brand.");
          setLoading(false);
          return;
        }
        setJobId(data.jobId);
        void poll(data.jobId);
      } catch {
        setError("Could not start AI campaign design.");
        setLoading(false);
      }
    }

    void start();
  }, [statusProp, initialJobId, brandId, brandUrl, poll]);

  const analysisSettled = status?.status === "done" || status?.status === "failed";
  const showBrief =
    askBrief && !briefDone && !generating && Boolean(status) && analysisSettled;

  async function generateFromBrief(brief: CampaignBriefChoice) {
    const id = jobId ?? status?.jobId;
    if (!id || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/brands/analyze/${id}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate campaigns. Please try again.");
        setGenerating(false);
        return;
      }
      setStatus((prev) =>
        prev
          ? { ...prev, campaigns: data.campaigns ?? [] }
          : prev
      );
      setBriefDone(true);
    } catch {
      setError("Could not generate campaigns. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function launch(c: CampaignView) {
    const id = jobId ?? status?.jobId;
    if (!id || launchingId) return;
    setLaunchingId(c.id);
    setError(null);
    try {
      const res = await fetch(`/api/brands/analyze/${id}/launch`, {
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
      setTimeout(() => {
        router.push(`/brands/${data.brandId}/campaigns/${data.campaignId}`);
      }, 600);
    } catch {
      setError("Something went wrong launching the campaign.");
      setLaunchingId(null);
    }
  }

  const campaigns = status?.campaigns ?? [];
  const waitingOnAnalysis = askBrief
    ? loading || (status != null && !analysisSettled)
    : loading || (status != null && status.status !== "done" && status.status !== "failed");

  return (
    <section className="space-y-3">
      {!hideHeading && !showBrief && (
        <div>
          <h2
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: "var(--font-dosis), sans-serif" }}
          >
            Your AI-designed referral campaigns
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Pick one to launch instantly. You can fine-tune everything afterward.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {waitingOnAnalysis ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#ebeef0] bg-white px-5 py-8 text-sm text-[#575962] shadow-sm">
          <Loader2 className="size-5 animate-spin text-[#FF5C62] motion-reduce:animate-none" />
          <div>
            <p className="font-semibold">
              {askBrief ? "Reading your brand…" : "Designing referral campaigns…"}
            </p>
            <p className="text-[#a7abc3]">
              {askBrief
                ? "We'll use the analysis to suggest a goal, colors, and copy next."
                : "Reading your brand and writing three ready-to-launch programs."}
            </p>
          </div>
        </div>
      ) : generating ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#ebeef0] bg-white px-5 py-8 text-sm text-[#575962] shadow-sm">
          <Loader2 className="size-5 animate-spin text-[#FF5C62] motion-reduce:animate-none" />
          <div>
            <p className="font-semibold">Designing referral campaigns…</p>
            <p className="text-[#a7abc3]">
              Writing three programs and a hero image from your goal, color, and tone.
            </p>
          </div>
        </div>
      ) : showBrief && status ? (
        <AiCampaignBrief
          status={status}
          brandColors={brandColors}
          submitting={generating}
          onSubmit={generateFromBrief}
        />
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d7dce0] bg-white p-6 text-sm text-[#a7abc3]">
          We couldn&apos;t generate campaigns automatically. Use a template below or start from scratch.
        </div>
      ) : (
        <div className="space-y-4">
        {askBrief && (
          <button
            type="button"
            onClick={() => setBriefDone(false)}
            className="text-sm font-medium text-[#a7abc3] hover:text-[#575962]"
          >
            Change goal, color, design, or copy
          </button>
        )}
        <div className="grid gap-5 lg:grid-cols-3">
          {campaigns.map((c, i) => (
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
        </div>
      )}
    </section>
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
  const meta = KIND_META[campaign.kind] || KIND_META.fast_growth;
  const Icon = meta.icon;
  const p = campaign.payload || {};
  const accent = p.accentColor || meta.from;

  return (
    <div
      style={{ animationDelay: `${index * 100}ms` }}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {p.bannerImageUrl ? (
        <div className="aspect-[16/7] w-full overflow-hidden bg-gray-100">
          <img
            src={p.bannerImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="p-5" style={{ background: `linear-gradient(135deg, ${accent}14, ${meta.to}08)` }}>
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: `linear-gradient(135deg, ${accent}, ${meta.to})` }}
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
          {isCampaignDesign(p.designStyle) ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium">
              {DESIGN_META[p.designStyle].label}
            </span>
          ) : null}
        </div>

        <button
          type="button"
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
            style={{ background: `linear-gradient(135deg, ${accent}, ${meta.to})` }}
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
              <>
                <Sparkles className="h-4 w-4" /> Launch this campaign
              </>
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
