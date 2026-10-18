"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  PartyPopperIcon,
  PuzzleIcon,
  XIcon,
} from "lucide-react";
import { copyText } from "@/lib/clipboard";

const COLORS = ["#ff5c62", "#7c3aed", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"];

/**
 * Shown once on the campaign page right after a successful publish (?live=1):
 * a celebration plus the three things to do next.
 */
export function LiveCelebration({
  brandName,
  referralUrl,
  publicPageUrl,
  widgetStudioHref,
}: {
  brandName: string;
  referralUrl: string;
  publicPageUrl: string;
  widgetStudioHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <section
      role="status"
      aria-labelledby="live-celebration-heading"
      className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-violet-50 p-6 shadow-lg sm:p-8"
    >
      <style>{`
        @keyframes rr-fall { 0% { transform: translateY(-20px) rotate(0); opacity: 0 } 10% { opacity: 1 } 100% { transform: translateY(260px) rotate(420deg); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .rr-fall { animation: none !important; opacity: 0 } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="rr-fall absolute top-0 block h-3 w-1.5 rounded-sm"
            style={{
              left: `${(i * 37) % 100}%`,
              background: COLORS[i % COLORS.length],
              animation: `rr-fall ${2.2 + (i % 5) * 0.35}s ${(i % 9) * 0.25}s ease-in 2`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setHidden(true);
          router.replace(pathname, { scroll: false });
        }}
        className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition hover:bg-white hover:text-gray-700"
      >
        <XIcon className="size-4" />
      </button>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md">
            <PartyPopperIcon className="size-7" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="live-celebration-heading"
              className="text-3xl font-extrabold tracking-tight text-gray-900"
              style={{ fontFamily: "var(--font-dosis), sans-serif" }}
            >
              {brandName} is live!
            </h2>
            <p className="mt-1 text-base text-gray-700">
              Your referral program is open. Every share, click and signup counts from now on.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={async () => {
            if (await copyText(referralUrl)) {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="flex min-h-14 items-center gap-3 rounded-2xl bg-[#d63a40] px-4 text-left text-white shadow-sm transition hover:bg-[#c2343a]"
        >
          {copied ? <CheckIcon className="size-5" aria-hidden="true" /> : <CopyIcon className="size-5" aria-hidden="true" />}
          <span>
            <span className="block text-sm font-semibold">{copied ? "Copied!" : "1. Copy your link"}</span>
            <span className="block text-xs text-white/80">Send it to your first customers</span>
          </span>
        </button>
        <a
          href={widgetStudioHref}
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 shadow-sm transition hover:border-[#d63a40]/40"
        >
          <PuzzleIcon className="size-5 text-[#7c3aed]" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold">2. Add the widget</span>
            <span className="block text-xs text-gray-500">Put it on your site in a minute</span>
          </span>
        </a>
        <a
          href={publicPageUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 shadow-sm transition hover:border-[#d63a40]/40"
        >
          <ExternalLinkIcon className="size-5 text-emerald-600" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold">3. See your live page</span>
            <span className="block text-xs text-gray-500">What your visitors see</span>
          </span>
        </a>
      </div>
    </section>
  );
}
