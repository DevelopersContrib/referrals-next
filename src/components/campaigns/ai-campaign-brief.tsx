"use client";

import { useMemo, useState } from "react";
import { Check, Heart, Rocket, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisStatus } from "@/components/onboarding/analysis-types";
import type { CampaignKind } from "@/lib/analysis/intelligence";
import {
  CAMPAIGN_DESIGNS,
  DESIGN_META,
  type CampaignDesignStyle,
} from "@/lib/analysis/campaign-design";

export type CampaignBriefChoice = {
  goalKind: CampaignKind;
  goalType: "visit" | "signup";
  color: string;
  copyTone: string;
  designStyle: CampaignDesignStyle;
  wantImage: boolean;
};

const GOALS: {
  id: CampaignKind;
  title: string;
  icon: LucideIcon;
  from: string;
  to: string;
}[] = [
  { id: "fast_growth", title: "Grow signups fast", icon: Rocket, from: "#FF5C62", to: "#ff7a54" },
  { id: "revenue", title: "Drive referral revenue", icon: TrendingUp, from: "#10b981", to: "#059669" },
  { id: "loyalty", title: "Reward loyal customers", icon: Heart, from: "#926efb", to: "#7c3aed" },
];

const FALLBACK_COLORS = ["#FF5C62", "#10b981", "#926efb", "#2563eb", "#0f172a", "#f59e0b"];

const TONES = [
  { id: "friendly", label: "Friendly & warm", desc: "Conversational, inviting, easy to share" },
  { id: "bold", label: "Bold & urgent", desc: "High energy, clear offer, act now" },
  { id: "professional", label: "Professional & clear", desc: "Trust-first, straightforward, no fluff" },
  { id: "playful", label: "Playful", desc: "Light, memorable, a little fun" },
] as const;

function hex6(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(s) ? `#${s.toLowerCase()}` : null;
}

function collectColors(status: AnalysisStatus, brandColors?: unknown): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (v: unknown) => {
    const hex = hex6(v);
    if (!hex || seen.has(hex)) return;
    seen.add(hex);
    out.push(hex);
  };

  if (brandColors && typeof brandColors === "object") {
    for (const v of Object.values(brandColors as Record<string, unknown>)) add(v);
  }
  for (const c of status.crawl?.colors ?? []) add(c);
  for (const c of FALLBACK_COLORS) add(c);
  return out.slice(0, 10);
}

function recommendedGoal(status: AnalysisStatus): CampaignKind {
  const score = status.intelligence?.readinessScore ?? 0;
  const blob = `${status.intelligence?.usp || ""} ${status.intelligence?.products || ""}`.toLowerCase();
  if (score >= 75) return "loyalty";
  if (/buy|price|purchase|order|checkout|shop/.test(blob)) return "revenue";
  return "fast_growth";
}

function goalWhy(status: AnalysisStatus, kind: CampaignKind): string {
  const intel = status.intelligence;
  const industry = intel?.industry || status.domain;
  if (kind === "fast_growth") {
    return intel?.opportunities?.[0] || `Get more ${industry} customers referring friends this month.`;
  }
  if (kind === "revenue") {
    return intel?.usp
      ? `Turn referrals into purchases — ${intel.usp}`
      : `Reward friends who buy, not just people who click.`;
  }
  return intel?.icp
    ? `Keep ${intel.icp} coming back by sharing.`
    : `Thank existing customers so they keep sending friends.`;
}

function recommendedDesign(status: AnalysisStatus, goalKind: CampaignKind): CampaignDesignStyle {
  const blob = `${status.intelligence?.industry || ""} ${status.intelligence?.brandVoice || ""} ${status.intelligence?.icp || ""}`.toLowerCase();
  if (/luxury|legal|financ|consult|saas|b2b|professional/.test(blob)) return "minimal";
  if (/food|health|wellness|community|family|coffee|restaurant/.test(blob)) return "warm";
  if (goalKind === "fast_growth" || /fashion|beauty|consumer|retail/.test(blob)) return "hero";
  return "editorial";
}

export function AiCampaignBrief({
  status,
  brandColors,
  submitting,
  onSubmit,
}: {
  status: AnalysisStatus;
  brandColors?: unknown;
  submitting: boolean;
  onSubmit: (brief: CampaignBriefChoice) => void;
}) {
  const colors = useMemo(() => collectColors(status, brandColors), [status, brandColors]);
  const recGoal = useMemo(() => recommendedGoal(status), [status]);
  const brandVoice = status.intelligence?.brandVoice?.trim() || "";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [goalKind, setGoalKind] = useState<CampaignKind>(recGoal);
  const [goalType, setGoalType] = useState<"visit" | "signup">("signup");
  const [color, setColor] = useState(colors[0] || "#FF5C62");
  const recDesign = useMemo(() => recommendedDesign(status, goalKind), [status, goalKind]);
  const [designStyle, setDesignStyle] = useState<CampaignDesignStyle>(recDesign);
  const [toneId, setToneId] = useState<string>(brandVoice ? "brand" : "friendly");
  const [wantImage, setWantImage] = useState(true);

  const copyTone =
    toneId === "brand" && brandVoice
      ? brandVoice
      : TONES.find((t) => t.id === toneId)?.label || "Friendly & warm";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#ebeef0] bg-white shadow-sm">
      <div className="border-b border-[#ebeef0] px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#FF5C62]">
          Step {step} of 4
        </p>
        <h2
          className="mt-1 text-xl font-bold text-[#575962]"
          style={{ fontFamily: "var(--font-dosis), sans-serif" }}
        >
          {step === 1 && "What should this campaign do?"}
          {step === 2 && "Pick the brand color"}
          {step === 3 && "How should the page look?"}
          {step === 4 && "How should the copy sound?"}
        </h2>
        <p className="mt-1 text-sm text-[#a7abc3]">
          {step === 1 &&
            `We already analyzed ${status.domain}. Choose the goal we should design around.`}
          {step === 2 && "Pulled from the site plus a few proven referral accents."}
          {step === 3 &&
            (status.intelligence?.industry
              ? `Suggested for ${status.intelligence.industry}: ${DESIGN_META[recDesign].label}.`
              : "This sets the landing layout, widget, and hero image style.")}
          {step === 4 &&
            (brandVoice
              ? `Recommended voice from the analysis: ${brandVoice}.`
              : "This sets headlines, emails, and share posts.")}
        </p>
        <ol className="mt-4 flex gap-2">
          {["Goal", "Color", "Design", "Copy"].map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3 | 4;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    done || active ? "bg-[#FF5C62] text-white" : "bg-[#eef0f3] text-[#a7abc3]"
                  }`}
                >
                  {done ? <Check className="size-3.5" /> : n}
                </span>
                <span className={`text-xs font-medium ${active ? "text-[#575962]" : "text-[#a7abc3]"}`}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {GOALS.map((g) => {
                const selected = goalKind === g.id;
                const Icon = g.icon;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoalKind(g.id)}
                    className={`rounded-2xl border p-4 text-left transition-shadow ${
                      selected
                        ? "border-[#FF5C62] bg-rose-50/40 shadow-sm"
                        : "border-[#ebeef0] bg-white hover:border-[#d7dce0]"
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                      style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-[#575962]">{g.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#a7abc3]">{goalWhy(status, g.id)}</p>
                    {g.id === recGoal && (
                      <span className="mt-2 inline-block rounded-full bg-[#fff1f1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF5C62]">
                        Suggested
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div>
              <p className="text-sm font-semibold text-[#575962]">Rewards unlock when friends…</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <UnlockOption
                  selected={goalType === "signup"}
                  title="Sign up"
                  desc="A friend joins or creates an account."
                  onClick={() => setGoalType("signup")}
                />
                <UnlockOption
                  selected={goalType === "visit"}
                  title="Visit the site"
                  desc="A friend clicks through and lands on your site."
                  onClick={() => setGoalType("visit")}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-wrap gap-3">
            {colors.map((hex) => {
              const selected = color === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${
                    selected ? "border-[#575962] bg-[#f7f8fa]" : "border-[#ebeef0] text-[#575962]"
                  }`}
                >
                  <span
                    className="h-6 w-6 rounded-full border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                  {hex}
                  {selected && <Check className="size-3.5 text-[#575962]" />}
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {CAMPAIGN_DESIGNS.map((id) => {
              const meta = DESIGN_META[id];
              const selected = designStyle === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDesignStyle(id)}
                  className={`overflow-hidden rounded-2xl border text-left transition-shadow ${
                    selected
                      ? "border-[#FF5C62] bg-rose-50/40 shadow-sm"
                      : "border-[#ebeef0] bg-white hover:border-[#d7dce0]"
                  }`}
                >
                  <DesignThumb style={id} color={color} />
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#575962]">{meta.label}</p>
                      {id === recDesign && (
                        <span className="rounded-full bg-[#fff1f1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF5C62]">
                          Suggested
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#a7abc3]">{meta.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {brandVoice ? (
                <ToneOption
                  selected={toneId === "brand"}
                  label="Brand voice"
                  desc={brandVoice}
                  badge="From analysis"
                  onClick={() => setToneId("brand")}
                />
              ) : null}
              {TONES.map((t) => (
                <ToneOption
                  key={t.id}
                  selected={toneId === t.id}
                  label={t.label}
                  desc={t.desc}
                  onClick={() => setToneId(t.id)}
                />
              ))}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ebeef0] px-4 py-3">
              <input
                type="checkbox"
                checked={wantImage}
                onChange={(e) => setWantImage(e.target.checked)}
                className="mt-0.5 size-4 rounded border-[#d7dce0] accent-[#FF5C62]"
              />
              <span>
                <span className="block text-sm font-semibold text-[#575962]">
                  Generate a hero image
                </span>
                <span className="mt-0.5 block text-xs text-[#a7abc3]">
                  Wide banner from the brand, your color, design, and tone. Used on
                  the landing page and widget.
                </span>
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#ebeef0] px-5 py-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 1 || submitting}
          onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3 | 4)))}
        >
          Back
        </Button>
        {step < 4 ? (
          <Button
            type="button"
            className="bg-[#FF5C62] text-white hover:bg-[#e54e54]"
            onClick={() => setStep((s) => (s === 4 ? 4 : ((s + 1) as 1 | 2 | 3 | 4)))}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            disabled={submitting}
            className="bg-[#FF5C62] text-white hover:bg-[#e54e54]"
            onClick={() =>
              onSubmit({ goalKind, goalType, color, copyTone, designStyle, wantImage })
            }
          >
            <Sparkles className="size-4" />
            Generate campaigns
          </Button>
        )}
      </div>
    </section>
  );
}

function DesignThumb({ style, color }: { style: CampaignDesignStyle; color: string }) {
  return (
    <div className="relative h-24 overflow-hidden bg-[#f4f5f7] px-3 pt-3">
      {style === "editorial" && (
        <div className="flex h-full gap-2">
          <div className="flex-1 space-y-1.5 pt-1">
            <span className="block h-2 w-8 rounded-sm bg-slate-300" />
            <span className="block h-2.5 w-16 rounded-sm bg-slate-400" />
            <span className="block h-1.5 w-20 rounded-sm bg-slate-200" />
          </div>
          <div className="h-16 w-14 rounded-md border border-slate-200 bg-white p-1.5 shadow-sm">
            <span className="mt-8 block h-2 w-full rounded-sm" style={{ backgroundColor: color }} />
          </div>
        </div>
      )}
      {style === "hero" && (
        <div className="flex h-full flex-col">
          <div className="h-10 rounded-t-md" style={{ backgroundColor: color, opacity: 0.85 }} />
          <div className="flex flex-1 flex-col items-center gap-1 pt-1.5">
            <span className="h-2 w-20 rounded-sm bg-slate-400" />
            <span className="h-4 w-16 rounded-sm" style={{ backgroundColor: color }} />
          </div>
        </div>
      )}
      {style === "minimal" && (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 bg-white">
          <span className="h-1.5 w-6 rounded-sm bg-slate-200" />
          <span className="h-2 w-14 rounded-sm bg-slate-400" />
          <span className="h-1.5 w-20 rounded-sm bg-slate-200" />
          <span className="mt-1 h-3 w-12 rounded-sm" style={{ backgroundColor: color }} />
        </div>
      )}
      {style === "warm" && (
        <div className="flex h-full flex-col gap-1.5 rounded-t-xl bg-[#faf6f1] px-1">
          <div className="h-8 rounded-xl" style={{ backgroundColor: color, opacity: 0.45 }} />
          <div className="flex gap-2">
            <div className="flex-1 space-y-1 pt-0.5">
              <span className="block h-2 w-12 rounded-full bg-slate-300" />
              <span className="block h-1.5 w-16 rounded-full bg-slate-200" />
            </div>
            <div className="h-10 w-12 rounded-2xl border border-slate-200 bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}

function UnlockOption({
  selected,
  title,
  desc,
  onClick,
}: {
  selected: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left ${
        selected ? "border-[#FF5C62] bg-rose-50/40" : "border-[#ebeef0] hover:border-[#d7dce0]"
      }`}
    >
      <p className="text-sm font-semibold text-[#575962]">{title}</p>
      <p className="mt-0.5 text-xs text-[#a7abc3]">{desc}</p>
    </button>
  );
}

function ToneOption({
  selected,
  label,
  desc,
  badge,
  onClick,
}: {
  selected: boolean;
  label: string;
  desc: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left ${
        selected ? "border-[#FF5C62] bg-rose-50/40" : "border-[#ebeef0] hover:border-[#d7dce0]"
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-[#575962]">{label}</p>
        {badge ? (
          <span className="rounded-full bg-[#fff1f1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF5C62]">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs text-[#a7abc3]">{desc}</p>
    </button>
  );
}
