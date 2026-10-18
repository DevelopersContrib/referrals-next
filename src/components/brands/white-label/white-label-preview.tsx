"use client";

import { useState } from "react";
import { GiftIcon, LockIcon, SparklesIcon } from "lucide-react";
import { BrandLogo } from "@/components/brands/brand-logo";

type Props = {
  domain: string;
  logoUrl: string | null;
  color: string;
  /** Paid/network brands are white label already; others see it locked. */
  unlocked: boolean;
};

/**
 * Side-by-side feel in one frame: flip between how a referral page looks with
 * Referrals.com branding and with the brand alone.
 */
export function WhiteLabelPreview({ domain, logoUrl, color, unlocked }: Props) {
  const [whiteLabel, setWhiteLabel] = useState(true);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">See the difference</p>
        <div
          role="radiogroup"
          aria-label="Preview mode"
          className="inline-flex rounded-full bg-gray-100 p-1 text-sm font-medium"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!whiteLabel}
            onClick={() => setWhiteLabel(false)}
            className={`min-h-9 rounded-full px-4 transition ${
              !whiteLabel ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            With Referrals.com
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={whiteLabel}
            onClick={() => setWhiteLabel(true)}
            className={`min-h-9 rounded-full px-4 transition ${
              whiteLabel ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
            style={whiteLabel ? { backgroundColor: color } : undefined}
          >
            Your brand only
          </button>
        </div>
      </div>

      {/* Browser frame */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <span className="flex gap-1" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-red-300" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-green-300" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-500">
            referrals.com/p/{domain.replace(/\./g, "-")}/campaign
          </span>
        </div>

        {/* Referrals.com top bar (branded mode only) */}
        {!whiteLabel && (
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 text-xs">
            <span className="font-bold text-[#d63a40]">Referrals.com</span>
            <span className="rounded-full bg-[#d63a40] px-3 py-1 font-semibold text-white">Sign up free</span>
          </div>
        )}

        {/* Campaign hero */}
        <div className="px-4 py-6 text-center sm:px-8">
          <div className="mx-auto flex w-fit items-center gap-2">
            <BrandLogo
              domain={domain}
              logoUrl={logoUrl}
              imgClassName="h-9 w-auto max-w-[140px] object-contain"
              fallbackClassName="flex size-9 items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-gray-600"
            />
          </div>
          <p className="mt-4 text-lg font-bold text-gray-900 sm:text-xl">
            Give a friend a gift, get one yourself
          </p>
          <p className="mt-1 text-sm text-gray-500">Share your link. When they join, you both win.</p>
          <span
            className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-5 text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            <GiftIcon className="size-4" aria-hidden="true" /> Get my link
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-500">
          <span className="font-medium text-gray-700">{domain}</span>
          {!whiteLabel && (
            <>
              <span className="mx-2 text-gray-300">|</span>
              Powered by <span className="font-medium text-[#d63a40]">Referrals.com</span>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-600">
        {whiteLabel ? (
          unlocked ? (
            <>
              <SparklesIcon className="size-4 shrink-0" style={{ color }} aria-hidden="true" />
              This is what your visitors see now. Only {domain}, nothing else.
            </>
          ) : (
            <>
              <LockIcon className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
              Unlocks the moment {domain} is published.
            </>
          )
        ) : (
          <>Free pages show the Referrals.com bar and a &ldquo;Powered by&rdquo; line.</>
        )}
      </p>
    </div>
  );
}
