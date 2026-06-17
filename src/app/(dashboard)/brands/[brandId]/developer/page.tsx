import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getBrandIfAccessible } from "@/lib/brand-access";
import {
  HomeIcon,
  ChevronRightIcon,
  CodeIcon,
  KeyIcon,
  ExternalLinkIcon,
  BookOpenIcon,
  PlayIcon,
} from "lucide-react";

interface PageProps {
  params: Promise<{ brandId: string }>;
}

export default async function BrandDeveloperPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);
  const { brandId } = await params;
  const id = parseInt(brandId, 10);

  if (isNaN(id)) notFound();

  const brand = await getBrandIfAccessible(id, memberId, isAdmin);
  if (!brand) notFound();

  const apiKey = await prisma.member_keys.findFirst({
    where: { userid: memberId },
    orderBy: { date_generated: "desc" },
  });

  const campaignCount = await prisma.member_campaigns.count({
    where: { url_id: id },
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#a7abc3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 transition-colors hover:text-brand"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3" />
        <Link href="/brands" className="transition-colors hover:text-brand">
          Brands
        </Link>
        <ChevronRightIcon className="size-3" />
        <Link
          href={`/brands/${brand.id}`}
          className="transition-colors hover:text-brand"
        >
          {brand.domain}
        </Link>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">Developer</span>
      </nav>

      {/* Header */}
      <div className="subheader">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/20">
            <CodeIcon className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Developer — {brand.domain}
            </h1>
            <p className="text-sm text-white/70">
              API access and integration guides for this brand
            </p>
          </div>
        </div>
      </div>

      {/* API Key Card */}
      <div className="rounded-xl border bg-[#1e1e2d] p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <KeyIcon className="size-5 text-[#FF5C62]" />
          <h2 className="text-lg font-semibold">Your API Key</h2>
        </div>
        {apiKey?.api_key ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
              <code className="flex-1 text-sm font-mono text-green-400 break-all">
                {apiKey.api_key}
              </code>
            </div>
            <p className="text-xs text-white/50">
              Generated{" "}
              {new Date(apiKey.date_generated).toLocaleDateString()}. This
              key works for all your brands.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              You haven&apos;t generated an API key yet.
            </p>
            <Link
              href="/api-keys"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF5C62] px-4 py-2 text-sm font-medium text-white hover:bg-[#ff4f58] transition"
            >
              <KeyIcon className="size-4" />
              Generate API Key
            </Link>
          </div>
        )}
      </div>

      {/* Quick Examples */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick API Examples for {brand.domain}
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Get this brand&apos;s details
            </p>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
{`curl https://referrals.com/api/v1/brands/${brand.id} \\
  -H "X-API-Key: ${apiKey?.api_key ? apiKey.api_key.substring(0, 12) + "..." : "ref_your_key"}"
`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              List campaigns for this brand
            </p>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
{`curl "https://referrals.com/api/v1/campaigns?brand_id=${brand.id}" \\
  -H "X-API-Key: ${apiKey?.api_key ? apiKey.api_key.substring(0, 12) + "..." : "ref_your_key"}"
`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Get brand stats
            </p>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
{`curl https://referrals.com/api/v1/brands/${brand.id}/stats \\
  -H "X-API-Key: ${apiKey?.api_key ? apiKey.api_key.substring(0, 12) + "..." : "ref_your_key"}"
`}
            </pre>
          </div>
        </div>
      </div>

      {/* Brand API Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 text-center">
          <p className="text-3xl font-bold text-[#FF5C62]">{brand.id}</p>
          <p className="mt-1 text-sm text-gray-600">Brand ID (url_id)</p>
        </div>
        <div className="rounded-xl border bg-white p-5 text-center">
          <p className="text-3xl font-bold text-[#FF5C62]">
            {campaignCount}
          </p>
          <p className="mt-1 text-sm text-gray-600">Campaigns</p>
        </div>
        <div className="rounded-xl border bg-white p-5 text-center">
          <p className="truncate text-lg font-bold text-[#FF5C62]">
            {brand.domain}
          </p>
          <p className="mt-1 text-sm text-gray-600">Domain</p>
        </div>
      </div>

      {/* Links to Developer Portal */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/developer/docs"
          className="flex items-center gap-3 rounded-xl border bg-white p-5 hover:shadow-md transition"
        >
          <CodeIcon className="size-6 text-blue-600" />
          <div>
            <p className="font-semibold text-gray-900">API Reference</p>
            <p className="text-sm text-gray-500">Full endpoint docs</p>
          </div>
          <ExternalLinkIcon className="ml-auto size-4 text-gray-400" />
        </Link>
        <Link
          href="/developer/playground"
          className="flex items-center gap-3 rounded-xl border bg-white p-5 hover:shadow-md transition"
        >
          <PlayIcon className="size-6 text-emerald-600" />
          <div>
            <p className="font-semibold text-gray-900">Playground</p>
            <p className="text-sm text-gray-500">Test API calls live</p>
          </div>
          <ExternalLinkIcon className="ml-auto size-4 text-gray-400" />
        </Link>
        <Link
          href="/developer/knowledgebase"
          className="flex items-center gap-3 rounded-xl border bg-white p-5 hover:shadow-md transition"
        >
          <BookOpenIcon className="size-6 text-purple-600" />
          <div>
            <p className="font-semibold text-gray-900">Knowledgebase</p>
            <p className="text-sm text-gray-500">Guides &amp; tutorials</p>
          </div>
          <ExternalLinkIcon className="ml-auto size-4 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
