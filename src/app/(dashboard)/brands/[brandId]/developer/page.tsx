import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getBrandIfAccessible } from "@/lib/brand-access";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyToClipboardButton } from "@/components/ui/copy-to-clipboard-button";
import { CodeBlock } from "@/components/developer/code-block";
import { cn } from "@/lib/utils";
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

  const [apiKey, campaignCount] = await Promise.all([
    prisma.member_keys.findFirst({
      where: { userid: memberId },
      orderBy: { date_generated: "desc" },
    }),
    prisma.member_campaigns.count({
      where: { url_id: id },
    }),
  ]);

  const maskedKey = apiKey?.api_key
    ? `${apiKey.api_key.substring(0, 12)}...`
    : "ref_your_key";

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

      {/* Subheader */}
      <div className="subheader flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/20">
            <CodeIcon className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Developer — {brand.domain}
            </h1>
            <p className="text-sm text-white/70">
              API access and integration for this brand
            </p>
          </div>
        </div>
        <Link href="/developer">
          <Button className="gap-2 border border-white/20 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
            <ExternalLinkIcon className="size-4" />
            Developer Portal
          </Button>
        </Link>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="size-5 text-brand" />
            Your API Key
          </CardTitle>
          <CardDescription>
            API keys are scoped to your account and work across all your brands.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKey?.api_key ? (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <code className="min-w-0 flex-1 break-all font-mono text-sm">
                {apiKey.api_key}
              </code>
              <CopyToClipboardButton
                text={apiKey.api_key}
                aria-label="Copy API key"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You haven&apos;t generated an API key yet.
              </p>
              <Link href="/api-keys">
                <Button className="gap-2 bg-brand text-white hover:bg-brand-hover">
                  <KeyIcon className="size-4" />
                  Generate API Key
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Quick API Examples for {brand.domain}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">
              Get this brand&apos;s details
            </p>
            <CodeBlock
              code={`curl https://referrals.com/api/v1/brands/${brand.id} \\\n  -H "X-API-Key: ${maskedKey}"`}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">
              List campaigns for this brand
            </p>
            <CodeBlock
              code={`curl "https://referrals.com/api/v1/campaigns?brand_id=${brand.id}" \\\n  -H "X-API-Key: ${maskedKey}"`}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Get brand stats</p>
            <CodeBlock
              code={`curl https://referrals.com/api/v1/brands/${brand.id}/stats \\\n  -H "X-API-Key: ${maskedKey}"`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card text-center">
          <p className="text-3xl font-bold text-brand">{brand.id}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand ID (url_id)
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="text-3xl font-bold text-brand">{campaignCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Campaigns</p>
        </div>
        <div className="stat-card text-center">
          <p className="truncate text-lg font-bold text-brand">
            {brand.domain}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Domain</p>
        </div>
      </div>

      {/* Portal Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            href: "/developer/docs",
            icon: CodeIcon,
            title: "API Reference",
            desc: "Full endpoint docs",
            color: "text-blue-600",
          },
          {
            href: "/developer/playground",
            icon: PlayIcon,
            title: "Playground",
            desc: "Test API calls live",
            color: "text-emerald-600",
          },
          {
            href: "/developer/knowledgebase",
            icon: BookOpenIcon,
            title: "Knowledgebase",
            desc: "Guides & tutorials",
            color: "text-purple-600",
          },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex items-center gap-3">
                  <Icon className={cn("size-6", link.color)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold transition-colors group-hover:text-brand">
                      {link.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {link.desc}
                    </p>
                  </div>
                  <ExternalLinkIcon className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
