import Image from "next/image";
import type { SocialProofStats } from "@/lib/social-proof";

const LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

function formatInt(value: number) {
  return value.toLocaleString("en-US");
}

/**
 * The right-hand value panel shown on auth pages (signup / signin).
 * Presentational only — pass live stats from the server page.
 */
export function AuthHeroPanel({
  stats,
  variant = "signup",
}: {
  stats: SocialProofStats;
  variant?: "signup" | "signin";
}) {
  const headline =
    variant === "signup"
      ? "Turn every customer into your next one."
      : "Welcome back to your growth engine.";

  const subline =
    variant === "signup"
      ? "Launch a referral program your customers actually want to share — in minutes."
      : "Pick up right where you left off and keep the referrals rolling in.";

  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#FF5C62] via-[#d24a86] to-[#926efb] lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* soft glows */}
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-[#926efb]/40 blur-3xl" />

      <div className="relative">
        <div className="flex h-11 w-fit items-center rounded-xl bg-white/95 px-4 py-2 shadow-sm">
          <Image
            src={LOGO_URL}
            alt="Referrals.com"
            width={132}
            height={42}
            unoptimized
            className="h-6 w-auto object-contain"
          />
        </div>

        <h2
          className="mt-10 text-4xl font-bold leading-tight tracking-tight text-white"
          style={{ fontFamily: "var(--font-dosis), sans-serif" }}
        >
          {headline}
        </h2>
        <p className="mt-4 max-w-md text-base text-white/85">{subline}</p>

        <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-white/90">
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur">
            Free to start
          </span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur">
            No credit card
          </span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur">
            Launch in 10 minutes
          </span>
        </div>
      </div>

      {/* Testimonial */}
      <div className="relative mt-10">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
          <div className="flex text-amber-300">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white">
            &ldquo;We used it for our new platform and it skyrocketed our new
            users to 300%!&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-[#d24a86]">
              JP
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Jack Paton</p>
              <p className="text-xs text-white/70">CEO, LaunchPad</p>
            </div>
          </div>
        </div>

        {/* Live activity ticker */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span>
              <strong className="font-semibold text-white">
                {formatInt(stats.recentSignups)}
              </strong>{" "}
              joined in the last 30 min
            </span>
          </span>
          <span>
            <strong className="font-semibold text-white">500k+</strong>{" "}
            subscribers
          </span>
          <span>
            <strong className="font-semibold text-white">
              {formatInt(stats.totalShares)}
            </strong>{" "}
            shares tracked
          </span>
        </div>
      </div>
    </div>
  );
}
