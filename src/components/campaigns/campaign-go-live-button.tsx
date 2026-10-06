"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon, RocketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";
import { toast } from "sonner";

type Props = {
  brandId: number;
  campaignId: number;
  /** Brand already has active Growth (or VNOC / admin bypass). */
  entitled: boolean;
  surfaceState: "draft" | "live" | "paused";
  className?: string;
};

export function CampaignGoLiveButton({
  brandId,
  campaignId,
  entitled,
  surfaceState,
  className,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (surfaceState === "live") {
    return (
      <span
        className={`inline-flex h-10 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 ${className ?? ""}`}
      >
        Live
      </span>
    );
  }

  const checkoutHref = `/billing/plan/${DEFAULT_PAID_PLAN_ID}?brandId=${brandId}&goLiveCampaign=${campaignId}`;

  async function goLiveNow() {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/go-live`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        checkoutUrl?: string;
      };
      if (res.status === 402 && data.checkoutUrl) {
        router.push(data.checkoutUrl);
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "Could not go live.");
        return;
      }
      toast.success("Campaign is live.");
      router.refresh();
    } catch {
      toast.error("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!entitled) {
    return (
      <Button
        asChild
        className={`h-10 gap-2 bg-brand font-semibold text-white hover:bg-brand-hover ${className ?? ""}`}
      >
        <Link href={checkoutHref}>
          <RocketIcon className="size-4" aria-hidden />
          Go Live
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      disabled={loading}
      onClick={() => void goLiveNow()}
      className={`h-10 gap-2 bg-brand font-semibold text-white hover:bg-brand-hover ${className ?? ""}`}
    >
      <RocketIcon className="size-4" aria-hidden />
      {loading ? "Going live…" : surfaceState === "paused" ? "Resume" : "Go Live"}
    </Button>
  );
}
