"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/campaign-templates", label: "Campaign Templates" },
  { href: "/pricing", label: "Pricing" },
];

/**
 * Referrals.com header for visitor-facing brand and campaign pages, which live
 * outside the (public) route group and so have no SessionProvider. It stays
 * deliberately session-free: these are conversion pages, and reading the
 * session here would cost an /api/auth/session round-trip on every view.
 *
 * Callers gate this on `showBranding` so paid white-label brands never get it.
 */
export function ReferralsSiteHeader({ menu = true }: { menu?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="https://referrals.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 shrink-0 items-center"
          aria-label="Referrals.com"
        >
          <Image
            src={LOGO_URL}
            alt="Referrals.com"
            width={126}
            height={40}
            priority
            unoptimized
            className="h-full w-auto object-contain object-left"
          />
        </a>

        {menu && (
          <nav className="hidden items-center gap-5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 transition-colors hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {menu && (
            <Link
              href="/signin"
              className="hidden rounded-lg border border-rose-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-rose-300 hover:bg-rose-50 lg:inline-flex"
            >
              Login
            </Link>
          )}
          <Link
            href="/signup"
            className="rounded-lg bg-[#FF5C62] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#ff4f58]"
          >
            Start your program
          </Link>
          {menu && (
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="ml-1 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {menu && mobileOpen && (
        <div className="border-t border-rose-100 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-4 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/signin"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg border border-rose-200 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-rose-50"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
