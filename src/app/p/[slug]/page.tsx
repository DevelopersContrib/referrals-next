import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ExternalLinkIcon } from "lucide-react";
import { BrandLogo } from "@/components/brands/brand-logo";
import { memberMustShowBranding } from "@/lib/member-subscription";
import { findPublicBrandBySlug } from "@/lib/public-campaign-server";

const LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

export default async function PublicBrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const brand = await findPublicBrandBySlug(slug);

  if (!brand) notFound();

  const showBranding = await memberMustShowBranding(brand.member_id);

  const campaigns = await prisma.member_campaigns.findMany({
    where: { url_id: brand.id, publish: "public" },
    orderBy: { date_added: "desc" },
  });

  const rawWebsite = (brand.url || brand.domain || "").trim();
  const brandWebsite = rawWebsite
    ? /^https?:\/\//i.test(rawWebsite)
      ? rawWebsite
      : `https://${rawWebsite}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal referral header */}
      <div className="border-b border-rose-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <a
            href="https://referrals.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center"
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
          <Link
            href="/signup"
            className="rounded-lg bg-[#FF5C62] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#ff4f58]"
          >
            Start your program
          </Link>
        </div>
      </div>

      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          {/* Brand logo from brandidentity.com/logo/<domain> (with graceful fallback chain) */}
          <BrandLogo
            domain={brand.domain}
            logoUrl={brand.logo_url}
            imgClassName="h-14 w-14 shrink-0 rounded-xl border bg-white object-contain p-1"
            fallbackClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-gray-100 text-2xl font-bold text-gray-500"
          />
          <div className="min-w-0">
            {brandWebsite ? (
              <a
                href={brandWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5"
              >
                <h1 className="text-2xl font-bold capitalize group-hover:text-brand">
                  {brand.domain}
                </h1>
                <ExternalLinkIcon className="size-4 text-gray-400 transition-colors group-hover:text-brand" />
              </a>
            ) : (
              <h1 className="text-2xl font-bold capitalize">{brand.domain}</h1>
            )}
            {brand.description && (
              <p className="mt-1 text-gray-600">{brand.description}</p>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">Active Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-gray-500">No active campaigns at the moment.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/p/${slug}/campaign/${campaign.id}`}
                className="block rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold">{campaign.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {campaign.goal_type === "visit"
                    ? `Goal: ${campaign.num_visits} visits`
                    : `Goal: ${campaign.num_signups} signups`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
      {showBranding && (
        <footer className="border-t bg-white mt-8 py-4 text-center text-sm text-gray-400">
          Powered by{" "}
          <a href="https://referrals.com" className="text-blue-600 hover:underline">
            Referrals.com
          </a>
        </footer>
      )}
    </div>
  );
}
