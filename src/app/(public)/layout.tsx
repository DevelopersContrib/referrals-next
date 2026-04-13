"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SessionProvider, useSession, signOut } from "next-auth/react";

const LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

function DropdownMenu({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="group relative">
      <button className="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-brand">
        {label}
        <svg
          className="h-4 w-4 transition-transform group-hover:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div className="invisible absolute left-0 top-full z-50 min-w-[200px] pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
        <div className="rounded-xl border border-rose-100 bg-white py-2 shadow-xl">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-rose-50 hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function userInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <PublicLayoutInner>{children}</PublicLayoutInner>
    </SessionProvider>
  );
}

function PublicLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobilePartnerOpen, setMobilePartnerOpen] = useState(false);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const displayName = session?.user?.name?.trim() || session?.user?.email || "";
  const initials = userInitials(session?.user?.name, session?.user?.email);

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-gradient-to-b from-white via-rose-50/40 to-orange-50/40 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex h-9 max-w-[min(100%,9rem)] shrink-0 items-center sm:h-11 sm:max-w-none">
            <Image
              src={LOGO_URL}
              alt="Referrals.com"
              width={142}
              height={45}
              priority
              unoptimized
              className="h-full w-auto max-w-full object-contain object-left"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-3 xl:gap-5 2xl:gap-6 lg:flex">
            <Link
              href="/"
              className="text-sm text-gray-600 transition-colors hover:text-brand"
            >
              Home
            </Link>
            <Link
              href="/features"
              className="text-sm text-gray-600 transition-colors hover:text-brand"
            >
              Features
            </Link>
            <Link
              href="/campaign-templates"
              className="text-sm text-gray-600 transition-colors hover:text-brand"
            >
              Campaign Templates
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-600 transition-colors hover:text-brand"
            >
              Pricing
            </Link>
            <DropdownMenu
              label="About"
              items={[
                { href: "/blog", label: "Blog" },
                { href: "/support", label: "Support" },
                { href: "/contact", label: "Contact" },
                { href: "/forum", label: "Forum" },
                { href: "/feedback", label: "Feedback" },
              ]}
            />
            <DropdownMenu
              label="Partner"
              items={[
                { href: "/partners", label: "Partner With Us" },
                { href: "/affiliate", label: "Become An Affiliate" },
              ]}
            />
          </nav>

          {/* Desktop Auth */}
          <div className="hidden items-center gap-3 lg:flex">
            {status === "loading" ? (
              <div className="h-9 w-40 animate-pulse rounded-lg bg-gray-100" aria-hidden />
            ) : isLoggedIn ? (
              <>
                <div
                  className="flex max-w-[220px] items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/60 py-1 pl-1 pr-3"
                  title="You are signed in"
                >
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5C62] to-[#926efb] text-xs font-bold text-white"
                    aria-hidden
                  >
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800">
                      {displayName}
                    </span>
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                      Signed in
                    </span>
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-[#FF5C62] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-rose-300 hover:bg-rose-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-rose-300 hover:bg-rose-50"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-[#FF5C62] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="border-t border-rose-100 bg-white lg:hidden">
            <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-1">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-brand"
                >
                  Home
                </Link>
                <Link
                  href="/features"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-brand"
                >
                  Features
                </Link>
                <Link
                  href="/campaign-templates"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-brand"
                >
                  Campaign Templates
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-brand"
                >
                  Pricing
                </Link>

                {/* About Accordion */}
                <button
                  onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-brand"
                >
                  About
                  <svg
                    className={`h-4 w-4 transition-transform ${mobileAboutOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {mobileAboutOpen && (
                  <div className="ml-4 flex flex-col gap-1">
                    {[
                      { href: "/blog", label: "Blog" },
                      { href: "/support", label: "Support" },
                      { href: "/contact", label: "Contact" },
                      { href: "/forum", label: "Forum" },
                      { href: "/feedback", label: "Feedback" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-rose-50 hover:text-brand"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Partner Accordion */}
                <button
                  onClick={() => setMobilePartnerOpen(!mobilePartnerOpen)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-brand"
                >
                  Partner
                  <svg
                    className={`h-4 w-4 transition-transform ${mobilePartnerOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {mobilePartnerOpen && (
                  <div className="ml-4 flex flex-col gap-1">
                    {[
                      { href: "/partners", label: "Partner With Us" },
                      {
                        href: "/affiliate",
                        label: "Become An Affiliate",
                      },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-rose-50 hover:text-brand"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-rose-100 pt-4">
                {status === "loading" ? (
                  <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" aria-hidden />
                ) : isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5C62] to-[#926efb] text-sm font-bold text-white">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{displayName}</p>
                        <p className="text-xs font-medium text-emerald-700">Signed in</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-[#FF5C62] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[#ff4f58]"
                    >
                      Go to dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        void signOut({ callbackUrl: "/" });
                      }}
                      className="rounded-lg border border-rose-200 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-rose-50"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg border border-rose-200 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-rose-50"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-[#FF5C62] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[#ff4f58]"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-700/80 bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand */}
            <div>
              <Link href="/" className="mb-4 inline-block">
                <Image
                  src={LOGO_URL}
                  alt="Referrals.com"
                  width={142}
                  height={45}
                  unoptimized
                />
              </Link>
              <p className="mt-2 text-sm text-slate-300">
                Build scalable and robust referral systems
              </p>
              <p className="mt-4 text-sm text-slate-300">
                <span className="text-slate-500">Phone:</span> 1-888-Referrals
              </p>
              {/* Social Icons */}
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://twitter.com/referralscom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com/referralscom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/referralscom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Get Started */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Get Started
              </h3>
              <ul className="mt-4 space-y-2">
                {[
                  { href: "/about", label: "About" },
                  { href: "/blog", label: "Blog" },
                  { href: "/support", label: "Support" },
                  { href: "/knowledgebase", label: "Knowledgebase" },
                  { href: "/contact", label: "Contact" },
                  { href: "/feedback", label: "Feedback" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Company
              </h3>
              <ul className="mt-4 space-y-2">
                {[
                  { href: "/community", label: "Community" },
                  { href: "/forum", label: "Forum" },
                  { href: "/partners", label: "Partners" },
                  { href: "/features", label: "Features" },
                  { href: "/whitelabel", label: "Whitelabel" },
                  { href: "/pricing", label: "Pricing" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-700 pt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Referrals.com. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
