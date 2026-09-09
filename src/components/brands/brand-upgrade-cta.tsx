import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";
import { cn } from "@/lib/utils";

type BrandUpgradeCtaProps = {
  brandId: number | string;
  /** Visual density for card overlays vs list rows vs sidebars. */
  variant?: "card" | "row" | "sidebar";
  className?: string;
};

/**
 * REF-J5 — always includes brandId. Callers must gate with
 * brandShouldShowUpgradeCta so VNOC / paid / Growth brands never see this.
 */
export function BrandUpgradeCta({
  brandId,
  variant = "row",
  className,
}: BrandUpgradeCtaProps) {
  const href = `/billing/plan/${DEFAULT_PAID_PLAN_ID}?brandId=${brandId}`;

  if (variant === "card") {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl",
          "bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 text-sm font-semibold text-white",
          "shadow-md shadow-violet-900/30 transition hover:brightness-110",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          className,
        )}
      >
        <SparklesIcon className="size-4 shrink-0" aria-hidden />
        Upgrade to Growth
      </Link>
    );
  }

  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold",
          "text-[#7c3aed] transition-colors hover:bg-violet-50 hover:text-[#6d28d9]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#926efb]",
          className,
        )}
      >
        <SparklesIcon className="size-4 shrink-0 text-[#926efb]" aria-hidden />
        Upgrade to Growth
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg",
        "bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-3 text-sm font-semibold text-white",
        "transition hover:brightness-110 sm:w-auto",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#926efb]",
        className,
      )}
    >
      <SparklesIcon className="size-3.5 shrink-0" aria-hidden />
      Upgrade
    </Link>
  );
}
