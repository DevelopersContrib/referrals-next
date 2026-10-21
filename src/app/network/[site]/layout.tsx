import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import {
  NetworkDesignSwitcher,
  NetworkFooter,
  NetworkHeader,
} from "@/components/network/network-chrome";
import { DESIGN_TOKENS } from "@/components/network/network-design";
import { brandIdentityLogo } from "@/lib/domain-brand";
import { networkSiteByKey, networkSiteUrl } from "@/lib/network-sites";
import { networkDesign, requireNetworkSite } from "./site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ site: string }>;
}): Promise<Metadata> {
  const site = networkSiteByKey((await params).site);
  if (!site) return {};
  const logo = brandIdentityLogo(site.domain);
  // Replaces the root layout's Referrals.com defaults for everything on this host.
  return {
    metadataBase: new URL(networkSiteUrl(site)),
    // absolute: the root "%s | Referrals.com" template must not reach a clone.
    title: { absolute: `${site.name}: ${site.tagline}`, template: `%s | ${site.name}` },
    description: site.description,
    openGraph: {
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [{ url: logo }],
    },
    twitter: { card: "summary" },
    // No icons: the logos are wide wordmarks, so clones keep the network favicon.
  };
}

export default async function NetworkSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ site: string }>;
}) {
  const site = await requireNetworkSite(params);
  const design = await networkDesign(site);
  const tokens = DESIGN_TOKENS[design];
  const theme = {
    "--net-primary": site.colors.primary,
    "--net-accent": site.colors.accent,
    "--net-ink": site.colors.ink,
    "--net-tint": site.colors.tint,
    "--net-radius": tokens.radius,
  } as CSSProperties;

  return (
    <div
      data-design={design}
      className={`${tokens.font} flex min-h-screen flex-col bg-white text-[var(--net-ink)] antialiased`}
      style={theme}
    >
      {/* VNOC Analytics under the clone's own domain, so its history continues. */}
      <Script
        src="https://analytics.vnoc.com/tracker.js"
        data-domain={site.domain}
        strategy="afterInteractive"
      />
      <NetworkHeader site={site} tone={tokens.header} />
      <main className="flex-1">{children}</main>
      <NetworkFooter site={site} />
      <NetworkDesignSwitcher current={design} />
    </div>
  );
}
