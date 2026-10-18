"use client";

import Link from "next/link";
import { CheckIcon, LockIcon, RocketIcon } from "lucide-react";
import { PublishGainCalculator } from "@/components/campaigns/publish-gain-calculator";

/**
 * The publish moment for a private (unpaid) campaign. Everything is set up
 * except going live, so the page leads with that one step: a hero card, a
 * fixed bar while scrolling, and locked sections that unlock on publish.
 * Honest by design: real price, cancel anytime, nothing fake or timed.
 */

const DONE_STEPS = [
  "Brand analyzed",
  "Campaign and rewards designed",
  "Widget and share page built",
];

const ON_PUBLISH = [
  "Your widget starts taking signups",
  "Your share link and public page go live",
  "Every referral and reward is tracked",
  "Your branding on the widget, not ours",
];

export function PublishCampaignHero({
  href,
  brandName,
  optionsHref,
}: {
  href: string;
  brandName: string;
  /** The brand's billing page with every plan option. */
  optionsHref?: string;
}) {
  return (
    <section
      aria-labelledby="publish-hero-heading"
      className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-lg shadow-rose-100/60"
    >
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#d63a40]">
            One step left
          </p>
          <h2
            id="publish-hero-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
            style={{ fontFamily: "var(--font-dosis), sans-serif" }}
          >
            Your campaign is ready. Publish it to start getting referrals.
          </h2>
          <ol className="mt-5 space-y-2.5">
            {DONE_STEPS.map((step) => (
              <li key={step} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckIcon className="size-3.5" aria-hidden="true" />
                </span>
                {step}
                <span className="sr-only">(done)</span>
              </li>
            ))}
            <li className="flex items-center gap-3 text-sm font-semibold text-gray-900">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d63a40] text-white">
                <RocketIcon className="size-3.5" aria-hidden="true" />
              </span>
              Publish {brandName} so people can join
              <span className="sr-only">(not done)</span>
            </li>
          </ol>
          <PublishGainCalculator />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
          <p className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-gray-900">$9</span>
            <span className="text-sm text-gray-500">/month for {brandName}</span>
          </p>
          <ul className="mt-4 space-y-2">
            {ON_PUBLISH.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-[#d63a40]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href={href}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d63a40] px-5 text-base font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-[#c2343a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d63a40]"
          >
            <RocketIcon className="size-4" aria-hidden="true" />
            Publish for $9/mo
          </Link>
          <p className="mt-3 text-center text-xs text-gray-500">
            Cancel anytime and it goes back to private.{" "}
            {optionsHref && (
              <Link href={optionsHref} className="font-medium text-gray-700 underline underline-offset-2">
                Yearly (1 month free) or agency plans
              </Link>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Fixed to the bottom of the screen while the campaign is private. */
export function PublishStickyBar({
  href,
  brandName,
}: {
  href: string;
  brandName: string;
}) {
  return (
    <>
      {/* Spacer so the fixed bar never covers the end of the page. */}
      <div aria-hidden="true" className="h-20" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-200 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 text-sm text-gray-700">
            <LockIcon className="mr-1.5 inline size-4 -translate-y-px text-amber-600" aria-hidden="true" />
            <span className="font-semibold text-gray-900">{brandName} is private.</span>{" "}
            <span className="hidden sm:inline">Publish to start taking signups.</span>
          </p>
          <Link
            href={href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#d63a40] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c2343a]"
          >
            Publish for $9/mo
          </Link>
        </div>
      </div>
    </>
  );
}

/** Wraps a section that only works once the campaign is live. */
export function LockedUntilPublished({
  href,
  title,
  description,
  children,
}: {
  href: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-52 overflow-hidden rounded-2xl">
      <div aria-hidden="true" className="pointer-events-none select-none opacity-40 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex max-w-md flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-5 py-4 text-center shadow-lg">
          <LockIcon className="size-5 text-amber-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-600">{description}</p>
          <Link
            href={href}
            className="mt-1 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#d63a40] px-4 text-sm font-semibold text-white transition hover:bg-[#c2343a]"
          >
            Publish for $9/mo
          </Link>
        </div>
      </div>
    </div>
  );
}
