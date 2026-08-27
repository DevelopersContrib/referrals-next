"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  CopyIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import {
  buildCampaignEmbedSnippets,
  publicCampaignUrl,
  trimEmbedBase,
} from "@/lib/campaign-embed-snippets";
import { CampaignPageEmbedPreview } from "@/components/campaigns/campaign-page-embed-preview";
import { IntegrationEmbedSections } from "@/components/campaigns/integration-embed-sections";

export interface CampaignIntegrationPanelProps {
  campaignId: number;
  brandId: string;
  baseUrl: string;
  /** Legacy slug for public URL; falls back to `publicSegment` or `brandId` */
  brandSlug?: string | null;
  /** URL segment for `/public/{segment}/campaign/{id}` (slug or numeric brand id) */
  publicSegment?: string | null;
  context?: "postCreate" | "dashboard";
  layout?: "tabs" | "sections";
  /** Show dashboard / campaign list buttons (hide when embedding sections-only elsewhere) */
  showFooterLinks?: boolean;
}

export function CampaignIntegrationPanel({
  campaignId,
  brandId,
  baseUrl,
  brandSlug,
  publicSegment,
  context = "postCreate",
  layout = "tabs",
  showFooterLinks = true,
}: CampaignIntegrationPanelProps) {
  const root = useMemo(
    () => trimEmbedBase(baseUrl || "https://referrals.com"),
    [baseUrl],
  );
  const id = campaignId;
  const seg = (publicSegment ?? brandSlug ?? brandId).toString().trim();
  const publicPath = publicCampaignUrl(root, seg, id);

  const snippets = buildCampaignEmbedSnippets(baseUrl, id, seg);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } catch {
      toast.error("Could not copy — select the code manually");
    }
  }, []);

  const isPostCreate = context === "postCreate";
  const isDashboard = context === "dashboard";

  return (
    <div className="space-y-6">
      {(isPostCreate || isDashboard) && (
        <div
          className={cn(
            "rounded-2xl border p-5 shadow-sm sm:p-6",
            isPostCreate
              ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/60"
              : "border-slate-200/80 bg-gradient-to-br from-slate-50 to-white",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              {isPostCreate && (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
                  <CheckCircle2Icon className="size-6" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {isPostCreate
                    ? "Campaign created — add it to your site"
                    : "Install on your site"}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  {isPostCreate
                    ? "Copy a snippet below — JavaScript, a compact widget iframe, a full-page campaign iframe, or Node.js. Placement comes from your "
                    : "Copy a snippet for your stack. Configure placement in "}
                  <Link
                    href={`/brands/${brandId}/campaigns/${id}/widget`}
                    className="font-medium text-brand underline-offset-2 hover:underline"
                  >
                    widget settings
                  </Link>
                  {isPostCreate ? "." : "."}
                </p>
              </div>
            </div>
            <Link
              href={`/brands/${brandId}/campaigns/${id}/widget`}
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "shrink-0 gap-1.5",
              )}
            >
              <LayoutDashboardIcon className="size-4" />
              Fine-tune widget
            </Link>
          </div>

          <div className="mt-4 flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-700 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="shrink-0 font-medium text-slate-900">
              Public campaign page:
            </span>
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-0 items-center gap-1 font-mono text-xs text-brand underline-offset-2 hover:underline sm:text-sm"
            >
              <span className="min-w-0 truncate">
                {publicPath.replace(/^https?:\/\//, "")}
              </span>
              <ExternalLinkIcon className="size-3.5 shrink-0 opacity-70" />
            </a>
          </div>
          {isPostCreate && (
            <p className="mt-3 text-xs text-slate-500">
              Same campaign id ({id}) works everywhere — the widget endpoints
              below apply wherever this domain serves the widget API.
            </p>
          )}
        </div>
      )}

      {layout === "sections" ? (
        <IntegrationEmbedSections
          snippets={snippets}
          brandId={brandId}
          campaignId={id}
        />
      ) : (
        <Tabs defaultValue="javascript">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-slate-100/80 p-1.5">
            <TabsTrigger value="javascript" className="text-xs sm:text-sm">
              JavaScript
            </TabsTrigger>
            <TabsTrigger value="iframe" className="text-xs sm:text-sm">
              Widget
            </TabsTrigger>
            {snippets.fullPage ? (
              <TabsTrigger value="fullpage" className="text-xs sm:text-sm">
                Full page
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="node" className="text-xs sm:text-sm">
              Node.js
            </TabsTrigger>
          </TabsList>

          <TabsContent value="javascript" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Recommended: one script tag loads configuration and injects the
              widget (embed, popup, or floating) from your{" "}
              <Link
                href={`/brands/${brandId}/campaigns/${id}/widget`}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                widget settings
              </Link>
              .
            </p>
            <CodeBlock
              code={snippets.js}
              onCopy={() => void copy(snippets.js, "js")}
              copied={copiedKey === "js"}
            />
          </TabsContent>

          <TabsContent value="iframe" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Compact widget iframe (about 560px tall). Paste into a sidebar,
              blog post, or CMS block. No JavaScript required.
            </p>
            <CodeBlock
              code={snippets.iframe}
              onCopy={() => void copy(snippets.iframe, "iframe")}
              copied={copiedKey === "iframe"}
            />
          </TabsContent>

          {snippets.fullPage ? (
            <TabsContent value="fullpage" className="mt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Full public campaign page — headline, join form, stats, and
                leaderboard — at{" "}
                <code className="rounded bg-slate-100 px-1 text-xs">
                  /p/{seg}/campaign/{id}
                </code>
                . Give it a dedicated /refer page so visitors can scroll the
                whole landing.
              </p>
              <CampaignPageEmbedPreview pageUrl={snippets.pageUrl} />
              <CodeBlock
                code={snippets.fullPage}
                onCopy={() => void copy(snippets.fullPage, "fullpage")}
                copied={copiedKey === "fullpage"}
              />
            </TabsContent>
          ) : null}

          <TabsContent value="node" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Server-rendered apps (Express / Fastify / Koa): send a page that
              includes the loader script. Run with{" "}
              <code className="rounded bg-slate-100 px-1">node server.js</code>{" "}
              and open <code className="rounded bg-slate-100 px-1">/refer</code>
              . For Next.js/React, use the{" "}
              <strong className="font-medium text-foreground">
                JavaScript
              </strong>{" "}
              tab inside a client component.
            </p>
            <CodeBlock
              code={snippets.node}
              onCopy={() => void copy(snippets.node, "node")}
              copied={copiedKey === "node"}
            />
          </TabsContent>
        </Tabs>
      )}

      {showFooterLinks && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/brands/${brandId}/campaigns/${id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "inline-flex justify-center",
            )}
          >
            Open campaign dashboard
          </Link>
          <Link
            href={`/brands/${brandId}/campaigns`}
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "inline-flex justify-center",
            )}
          >
            Back to all campaigns
          </Link>
        </div>
      )}
    </div>
  );
}

function CodeBlock({
  code,
  onCopy,
  copied,
}: {
  code: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-inner">
      <div className="flex items-center justify-end border-b border-slate-800 px-3 py-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 shrink-0 gap-1.5 border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
          onClick={onCopy}
        >
          <CopyIcon className="size-3.5" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-[min(70vh,420px)] max-w-full overflow-auto overscroll-x-contain p-4 text-xs leading-relaxed sm:text-sm">
        <code className="block">{code}</code>
      </pre>
    </div>
  );
}
