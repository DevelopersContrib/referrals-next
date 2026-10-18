import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  GlobeIcon,
  LayoutTemplateIcon,
  LockIcon,
  MailIcon,
  PaletteIcon,
  PanelTopIcon,
  SparklesIcon,
  StoreIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandLogo } from "@/components/brands/brand-logo";
import { WhiteLabelPreview } from "@/components/brands/white-label/white-label-preview";
import { AddressCard } from "@/components/brands/white-label/address-card";
import { getBrandEntitlement } from "@/lib/member-subscription";
import { BRAND_MONTHLY_PLAN_ID } from "@/lib/billing-constants";

export const metadata: Metadata = {
  title: "White label",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ brandId: string }> };

const HEX = /^#?([0-9a-f]{6})$/i;
const hex = (v: unknown) => (typeof v === "string" && HEX.test(v.trim()) ? `#${v.trim().replace("#", "").toLowerCase()}` : null);

export default async function WhiteLabelPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const { brandId: raw } = await params;
  const brandId = parseInt(raw, 10);
  if (Number.isNaN(brandId)) notFound();

  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
    select: { id: true, member_id: true, domain: true, slug: true, logo_url: true, brand_colors: true },
  });
  if (!brand || brand.member_id !== memberId) notFound();

  const [entitlement, latestCampaign, subdomain, plan, customDomain] = await Promise.all([
    getBrandEntitlement(brandId, { applyAdminBypass: false }),
    prisma.member_campaigns.findFirst({
      where: { url_id: brandId, publish: "public" },
      orderBy: { id: "desc" },
      select: { id: true },
    }),
    prisma.brand_subdomains.findFirst({
      where: { url_id: brandId },
      orderBy: { id: "desc" },
      select: { subdomain: true },
    }),
    prisma.plans.findUnique({ where: { id: BRAND_MONTHLY_PLAN_ID }, select: { price: true } }),
    prisma.brand_whitelabel.findFirst({
      where: { url_id: brandId, domain: { not: null } },
      orderBy: { id: "desc" },
      select: { domain: true },
    }),
  ]);
  const widget = latestCampaign
    ? await prisma.campaign_widget.findFirst({
        where: { campaign_id: latestCampaign.id },
        select: { button_color: true },
      })
    : null;

  const unlocked = Boolean(entitlement?.hideBranding);
  const domain = brand.domain || brand.slug || "your brand";
  const colors = (brand.brand_colors ?? {}) as Record<string, unknown>;
  const palette = ["primary", "secondary", "accent", "background", "text"]
    .map((role) => ({ role, value: hex(colors[role]) }))
    .filter((c): c is { role: string; value: string } => c.value !== null);
  const color = hex(colors.primary) ?? hex(widget?.button_color) ?? "#d63a40";
  const price = plan?.price != null ? Number(plan.price) : 9;
  const pageBase = brand.slug ? `/p/${brand.slug}` : null;
  const why = entitlement?.isVnoc ? "it's a network brand" : "it's published";

  const surfaces = [
    {
      icon: LayoutTemplateIcon,
      title: "Campaign pages",
      body: "No Referrals.com bar, no sign-up button, no “Powered by” line.",
      href: pageBase && latestCampaign ? `${pageBase}/campaign/${latestCampaign.id}` : null,
    },
    {
      icon: StoreIcon,
      title: "Brand page",
      body: "Your public page lists your campaigns under your name only.",
      href: pageBase,
    },
    {
      icon: PanelTopIcon,
      title: "Website widget",
      body: "The widget on your site shows your logo and colors, nothing else.",
      href: `/brands/${brandId}/campaigns`,
      internal: true,
    },
    {
      icon: MailIcon,
      title: "Invite emails",
      body: "Friends invited by your customers get an email from your campaign only.",
      href: null,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm sm:p-8"
        style={{ background: `linear-gradient(135deg, ${color} 0%, #1f2937 130%)` }}
      >
        <div className="flex flex-wrap items-start gap-5">
          <div className="rounded-2xl bg-white p-2 shadow-lg">
            <BrandLogo
              domain={domain}
              logoUrl={brand.logo_url}
              imgClassName="h-14 w-14 object-contain"
              fallbackClassName="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-500"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-white/75">White label</p>
            <h1
              className="mt-1 text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-dosis), sans-serif" }}
            >
              {unlocked ? `Every page is 100% ${domain}` : `Make every page 100% ${domain}`}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/85">
              {unlocked
                ? `White label is on because ${why}. Your customers only ever see your brand.`
                : "Right now your pages carry Referrals.com branding. Publish this brand and it disappears everywhere at once."}
            </p>
          </div>
          {unlocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2Icon className="size-4" aria-hidden="true" /> On
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/30">
              <LockIcon className="size-4" aria-hidden="true" /> Locked
            </span>
          )}
        </div>
        {!unlocked && (
          <Link
            href={`/brands/${brandId}/billing`}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-gray-900 shadow transition hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0"
          >
            <SparklesIcon className="size-4" style={{ color }} aria-hidden="true" />
            Unlock white label · ${price}/mo
          </Link>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <WhiteLabelPreview domain={domain} logoUrl={brand.logo_url} color={color} unlocked={unlocked} />
        </div>

        {/* Brand kit */}
        <section
          aria-labelledby="brand-kit"
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-5"
        >
          <div className="flex items-center gap-2">
            <PaletteIcon className="size-4 text-[#7c3aed]" aria-hidden="true" />
            <h2 id="brand-kit" className="font-semibold text-gray-900">
              Your brand kit
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">What your pages, widget and emails are built from.</p>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <BrandLogo
              domain={domain}
              logoUrl={brand.logo_url}
              imgClassName="h-12 w-12 rounded-lg border bg-white object-contain p-1"
              fallbackClassName="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 font-bold text-gray-600"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Logo</p>
              <p className="truncate text-xs text-gray-500">
                {brand.logo_url ? "From your website" : "Using your site icon. Upload a logo for a sharper look."}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">Colors</p>
            {palette.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-3">
                {palette.map((c) => (
                  <li key={c.role} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span
                      className="size-6 rounded-md border border-black/10"
                      style={{ backgroundColor: c.value }}
                      aria-hidden="true"
                    />
                    <span className="capitalize">{c.role}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <span className="size-4 rounded border border-black/10" style={{ backgroundColor: color }} aria-hidden="true" />
                Using your button color. Add brand colors in Settings.
              </p>
            )}
          </div>

          <Link
            href={`/brands/${brandId}/edit`}
            className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:border-[#7c3aed]/40 hover:text-[#7c3aed]"
          >
            Edit logo and colors
          </Link>
        </section>
      </div>

      {/* Where it applies */}
      <section aria-labelledby="where" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 id="where" className="font-semibold text-gray-900">
          Where your brand takes over
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {surfaces.map((s) => (
            <li key={s.title} className="flex gap-3 rounded-xl border border-gray-100 p-4">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}1a`, color }}
              >
                <s.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{s.title}</p>
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2Icon className="size-3" aria-hidden="true" /> Your brand only
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                      <LockIcon className="size-3" aria-hidden="true" /> Shows Referrals.com
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{s.body}</p>
                {s.href && (
                  <Link
                    href={s.href}
                    target={s.internal ? undefined : "_blank"}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    style={{ color }}
                  >
                    {s.internal ? "Open campaigns" : "View it live"}
                    {!s.internal && <ExternalLinkIcon className="size-3.5" aria-hidden="true" />}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Own address */}
      <section
        aria-labelledby="own-address"
        className="rounded-2xl border border-[#7c3aed]/20 bg-gradient-to-br from-violet-50 to-rose-50 p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <GlobeIcon className="size-4 text-[#7c3aed]" aria-hidden="true" />
          <h2 id="own-address" className="font-semibold text-gray-900">
            Your own web address
          </h2>
          {!unlocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              <LockIcon className="size-3" aria-hidden="true" /> After publishing
            </span>
          )}
        </div>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Put your referral pages on an address your customers trust. Your brand page opens at the
          address itself, and each campaign at <strong>/campaign/&lt;id&gt;</strong>.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Free and instant</p>
            <AddressCard
              kind="subdomain"
              brandId={brandId}
              initial={subdomain?.subdomain ?? null}
              disabled={!unlocked}
              color={color}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              Your domain · one DNS record
            </p>
            <AddressCard
              kind="custom"
              brandId={brandId}
              initial={customDomain?.domain ?? null}
              disabled={!unlocked}
              color={color}
            />
          </div>
        </div>
        {!unlocked && (
          <p className="mt-3 text-sm text-gray-600">
            <Link href={`/brands/${brandId}/billing`} className="font-semibold text-[#7c3aed] hover:underline">
              Publish {domain}
            </Link>{" "}
            to connect an address.
          </p>
        )}
      </section>
    </div>
  );
}
