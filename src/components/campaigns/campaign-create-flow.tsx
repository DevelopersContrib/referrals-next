"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  GiftIcon,
  PanelTopIcon,
  PencilRulerIcon,
  Share2Icon,
  SparklesIcon,
  TrophyIcon,
  type LucideIcon,
} from "lucide-react";
import {
  CampaignWizard,
  type CampaignType,
  type RewardType,
} from "@/components/campaigns/campaign-wizard";
import {
  campaignPresets,
  resolvePreset,
  type CampaignPreset,
} from "@/lib/campaign-presets";
import { Badge } from "@/components/ui/badge";
import { CampaignCreateEditor } from "@/components/campaigns/campaign-create-editor";

const ICONS: Record<string, LucideIcon> = {
  share: Share2Icon,
  sparkles: SparklesIcon,
  "panel-top": PanelTopIcon,
  gift: GiftIcon,
  trophy: TrophyIcon,
};

export interface CampaignCreateFlowProps {
  brandId: string;
  brandUrl?: string | null;
  brandSlug?: string | null;
  brandName?: string | null;
  brandColors?: Record<string, string> | null;
  embedBaseUrl: string;
  campaignTypes: CampaignType[];
  rewardTypes: RewardType[];
  initialPublish?: "public" | "private";
}

export function CampaignCreateFlow({
  brandId,
  brandUrl,
  brandSlug,
  brandName,
  brandColors,
  embedBaseUrl,
  campaignTypes,
  rewardTypes,
  initialPublish = "private",
}: CampaignCreateFlowProps) {
  // null = gallery, "scratch" = blank wizard, otherwise a preset id
  const [selected, setSelected] = useState<string | null>(null);

  const groups = useMemo(() => {
    const byGroup = new Map<string, CampaignPreset[]>();
    for (const p of campaignPresets) {
      const arr = byGroup.get(p.group) ?? [];
      arr.push(p);
      byGroup.set(p.group, arr);
    }
    return Array.from(byGroup.entries());
  }, []);

  const activePreset =
    selected && selected !== "scratch"
      ? campaignPresets.find((p) => p.id === selected) ?? null
      : null;

  const resolved = useMemo(() => {
    if (!activePreset) return null;
    return resolvePreset(activePreset, {
      campaignTypes,
      rewardTypes,
      brandName: brandName || brandUrl,
      brandColors,
    });
  }, [activePreset, campaignTypes, rewardTypes, brandName, brandUrl, brandColors]);

  if (selected !== null) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#a7abc3] transition-colors hover:text-[#575962]"
        >
          <ArrowLeftIcon className="size-4" />
          Back to templates
        </button>

        {selected === "scratch" ? (
          <CampaignCreateEditor
            brandId={brandId}
            brandUrl={brandUrl}
            campaignTypes={campaignTypes}
            rewardTypes={rewardTypes}
            initialPublish={initialPublish}
          />
        ) : (
          <>
            {activePreset ? (
              <div className="flex items-start gap-3 rounded-xl border border-[#ebeef0] bg-gradient-to-r from-white to-rose-50/40 px-4 py-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${activePreset.gradient} text-white shadow-sm`}
                >
                  {(() => {
                    const Icon = ICONS[activePreset.icon] ?? SparklesIcon;
                    return <Icon className="size-5" />;
                  })()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#575962]">
                    {activePreset.label} template
                  </p>
                  <p className="text-xs text-[#a7abc3]">
                    Prefilled and ready — tweak anything before you launch.
                  </p>
                </div>
              </div>
            ) : null}

            <CampaignWizard
              brandId={brandId}
              brandUrl={brandUrl}
              brandSlug={brandSlug}
              embedBaseUrl={embedBaseUrl}
              campaignTypes={campaignTypes}
              rewardTypes={rewardTypes}
              initialPublish={initialPublish}
              initialForm={resolved?.form}
              initialWidget={resolved?.widget}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#a7abc3]">
          AI campaign builder
        </h2>
        <Link
          href={`/brands/${brandId}/campaigns/ai`}
          className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-[#ebeef0] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#FF5C62]/40 hover:shadow-md motion-reduce:transform-none sm:max-w-sm"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF5C62] to-[#926efb]" />
          <div className="mb-3 flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5C62] to-[#926efb] text-white shadow-sm">
              <SparklesIcon className="size-5" />
            </span>
            <Badge className="text-[10px]">AI</Badge>
          </div>
          <h3 className="text-base font-semibold text-[#575962]">
            Design with AI
          </h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-[#a7abc3]">
            Open the campaign AI builder — three ready-to-launch programs for this brand.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#FF5C62]">
            Open AI builder
            <ArrowRightIcon className="size-4" />
          </span>
        </Link>
      </section>

      {groups.map(([group, presets]) => (
        <section key={group} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#a7abc3]">
            {group}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => {
              const Icon = ICONS[preset.icon] ?? SparklesIcon;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelected(preset.id)}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#ebeef0] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#FF5C62]/40 hover:shadow-md motion-reduce:transform-none"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${preset.gradient}`}
                  />
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${preset.gradient} text-white shadow-sm`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <Badge
                      variant={preset.tag === "Premium" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {preset.tag}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-[#575962]">
                    {preset.label}
                  </h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-[#a7abc3]">
                    {preset.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#FF5C62] opacity-0 transition-opacity group-hover:opacity-100">
                    Use this template
                    <ArrowRightIcon className="size-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#a7abc3]">
          Prefer full control?
        </h2>
        <button
          type="button"
          onClick={() => setSelected("scratch")}
          className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#ebeef0] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#FF5C62]/40 hover:shadow-md motion-reduce:transform-none sm:max-w-sm"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-600 to-slate-400" />
          <div className="mb-3 flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-500 text-white shadow-sm">
              <PencilRulerIcon className="size-5" />
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Full editor
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-[#575962]">Start from scratch</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-[#a7abc3]">
            Same editor as Edit Campaign — type, reward, share, widget, and publish.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#FF5C62] opacity-0 transition-opacity group-hover:opacity-100">
            Open editor
            <ArrowRightIcon className="size-4" />
          </span>
        </button>
      </section>
    </div>
  );
}
