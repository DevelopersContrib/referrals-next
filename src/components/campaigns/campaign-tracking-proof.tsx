"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2Icon, EyeIcon, Loader2Icon } from "lucide-react";
import { IntegrationsEmbedLink } from "@/components/campaigns/campaign-tabs";

type Props = {
  campaignId: number;
  brandId: string;
  initialImpressions: number;
  initialClicks: number;
};

/**
 * Closes the Phase 0 activation loop: prove first widget impression (and optional clicks).
 */
export function CampaignTrackingProof({
  campaignId,
  brandId,
  initialImpressions,
  initialClicks,
}: Props) {
  const [impressions, setImpressions] = useState(initialImpressions);
  const [clicks, setClicks] = useState(initialClicks);
  const [polling, setPolling] = useState(initialImpressions < 1);

  useEffect(() => {
    if (impressions >= 1) {
      setPolling(false);
      return;
    }

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/stats`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          impressions?: number;
          clicks?: number;
        };
        if (cancelled) return;
        const nextImpressions = Number(data.impressions ?? 0);
        const nextClicks = Number(data.clicks ?? 0);
        setImpressions(nextImpressions);
        setClicks(nextClicks);
        if (nextImpressions >= 1) setPolling(false);
      } catch {
        /* ignore transient poll errors */
      }
    };

    void tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [campaignId, impressions]);

  if (impressions >= 1) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
        <div className="flex flex-wrap items-center gap-2">
          <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
          <p className="font-semibold">Tracking verified</p>
          <span className="text-emerald-800/80">
            {impressions.toLocaleString()} impression
            {impressions === 1 ? "" : "s"}
            {clicks > 0
              ? ` · ${clicks.toLocaleString()} click${clicks === 1 ? "" : "s"}`
              : ""}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
      <div className="flex flex-wrap items-start gap-2">
        <EyeIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Waiting for first widget view</p>
          <p className="mt-1 text-amber-900/80">
            Install the embed on your site (or open the live preview), then keep
            this page open. Impressions appear within a few seconds once the
            widget loads.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <IntegrationsEmbedLink className="font-semibold text-rose-600 underline-offset-2 hover:underline">
              Install / embed
            </IntegrationsEmbedLink>
            <Link
              href={`/brands/${brandId}/campaigns/${campaignId}/widget`}
              className="font-semibold text-rose-600 underline-offset-2 hover:underline"
            >
              Open widget studio
            </Link>
            {polling && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-800/70">
                <Loader2Icon className="size-3.5 animate-spin" />
                Listening for impressions…
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
