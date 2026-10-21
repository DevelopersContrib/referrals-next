import Link from "next/link";
import { BrandLogo } from "@/components/brands/brand-logo";
import { BOUNCY } from "@/components/network/fun";
import { DESIGN_LABEL, type DesignTokens } from "@/components/network/network-design";
import {
  NETWORK_DESIGNS,
  networkAppOrigin,
  networkPagePath,
  networkSigninHref,
  networkSignupHref,
  type NetworkDesign,
  type NetworkPage,
  type NetworkSite,
} from "@/lib/network-sites";

const NAV_LABEL: Record<NetworkPage, string> = {
  home: "Home",
  "how-it-works": "How it works",
  pricing: "Pricing",
};

const CTA_STYLE = {
  primary: "bg-[var(--net-primary)] text-white hover:brightness-110",
  light: "bg-white text-[var(--net-ink)] hover:bg-white/90",
  ink: "bg-[var(--net-ink)] text-white hover:brightness-125",
} as const;

/** Sign-up button; always leads to sign-up on referrals.com, credited to the clone. */
export function NetworkCta({
  site,
  label,
  tone = "primary",
  className = "",
}: {
  site: NetworkSite;
  label?: string;
  tone?: keyof typeof CTA_STYLE;
  className?: string;
}) {
  return (
    <a
      href={networkSignupHref(site)}
      className={`${BOUNCY} inline-flex items-center justify-center rounded-[var(--net-radius)] px-6 py-3.5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${CTA_STYLE[tone]} ${className}`}
    >
      {label ?? site.hero.cta}
    </a>
  );
}

const HEADER_STYLE: Record<DesignTokens["header"], { bar: string; link: string; cta: keyof typeof CTA_STYLE }> = {
  dark: { bar: "bg-[var(--net-ink)] border-b border-white/10", link: "text-white/75 hover:text-white", cta: "light" },
  tint: { bar: "bg-[var(--net-tint)]", link: "text-[var(--net-ink)]/75 hover:text-[var(--net-ink)]", cta: "primary" },
  light: { bar: "bg-white border-b-2 border-[var(--net-ink)]", link: "text-[var(--net-ink)]/75 hover:text-[var(--net-ink)]", cta: "ink" },
  clean: { bar: "bg-white border-b border-black/10", link: "text-[var(--net-ink)]/70 hover:text-[var(--net-ink)]", cta: "primary" },
};

export function NetworkHeader({ site, tone }: { site: NetworkSite; tone: DesignTokens["header"] }) {
  const style = HEADER_STYLE[tone];
  return (
    <header className={`relative z-30 ${style.bar}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
        {/* brandidentity.com logos are wordmarks that already spell the name. */}
        <Link
          href="/"
          aria-label={`${site.name} home`}
          className={`flex min-w-0 items-center ${tone === "dark" ? "rounded-lg bg-white px-2.5 py-1" : ""}`}
        >
          <BrandLogo
            domain={site.domain}
            imgClassName={`${tone === "dark" ? "h-8" : "h-10"} w-auto max-w-[160px] object-contain object-left sm:max-w-[220px]`}
            fallbackClassName="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--net-primary)] text-sm font-bold text-white"
          />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          {site.pages
            .filter((p) => p !== "home")
            .map((p) => (
              <Link key={p} href={networkPagePath(p)} className={style.link}>
                {NAV_LABEL[p]}
              </Link>
            ))}
        </nav>
        <div className="flex shrink-0 items-center gap-4">
          <a href={networkSigninHref(site)} className={`text-sm font-medium ${style.link}`}>
            Sign in
          </a>
          {/* Phones get the hero's button instead; the bar has no room for both. */}
          <span className="hidden sm:block">
            <NetworkCta site={site} tone={style.cta} className="!px-4 !py-2 !text-sm" />
          </span>
        </div>
      </div>
    </header>
  );
}

export function NetworkFooter({ site }: { site: NetworkSite }) {
  const app = networkAppOrigin();
  const linkClass = "text-[var(--net-ink)]/70 hover:text-[var(--net-ink)]";
  return (
    <footer className="mt-auto bg-[var(--net-tint)] text-[var(--net-ink)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="max-w-md">
          <p className="text-lg font-bold">{site.name}</p>
          <p className="mt-2 text-sm text-[var(--net-ink)]/70">{site.description}</p>
          <p className="mt-4 text-sm text-[var(--net-ink)]/70">
            {site.name} is part of the{" "}
            <a href={app} className="font-semibold text-[var(--net-ink)] underline underline-offset-2">
              Referrals.com
            </a>{" "}
            network. Accounts, billing and support are on Referrals.com.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:justify-self-end">
          {site.pages.map((p) => (
            <Link key={p} href={networkPagePath(p)} className={linkClass}>
              {NAV_LABEL[p]}
            </Link>
          ))}
          <a href={networkSigninHref(site)} className={linkClass}>
            Sign in
          </a>
          <a href={`${app}/support`} className={linkClass}>
            Support
          </a>
          <a href={`${app}/privacy`} className={linkClass}>
            Privacy
          </a>
          <a href={`${app}/terms`} className={linkClass}>
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}

/** Questions as native disclosure widgets: they open on click, no script needed. */
export function NetworkFaq({ site, columns = 1 }: { site: NetworkSite; columns?: 1 | 2 }) {
  return (
    <div className={columns === 2 ? "grid gap-x-12 md:grid-cols-2" : ""}>
      {site.faqs.map((f) => (
        <details key={f.q} className="group border-b border-current/15 py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span
              aria-hidden
              className="mt-1 text-xl leading-none text-[var(--net-primary)] transition-transform group-open:rotate-45 motion-reduce:transition-none"
            >
              +
            </span>
          </summary>
          <p className="mt-3 max-w-prose opacity-75">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Local-only bar for comparing the three designs; never rendered in production. */
export function NetworkDesignSwitcher({ current }: { current: NetworkDesign }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <nav
      aria-label="Preview design"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full bg-gray-900/90 p-1 text-sm text-white shadow-xl backdrop-blur"
    >
      {NETWORK_DESIGNS.map((d) => (
        <a
          key={d}
          href={`?design=${d}`}
          aria-current={d === current ? "true" : undefined}
          className={`rounded-full px-3 py-1.5 font-medium sm:px-4 ${d === current ? "bg-white text-gray-900" : "text-white/75 hover:text-white"}`}
        >
          {DESIGN_LABEL[d]}
        </a>
      ))}
    </nav>
  );
}
