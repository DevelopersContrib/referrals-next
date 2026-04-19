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
import { buildCampaignEmbedSnippets, trimEmbedBase } from "@/lib/campaign-embed-snippets";
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
  const root = useMemo(() => trimEmbedBase(baseUrl || "https://referrals.com"), [baseUrl]);
  const id = campaignId;
  const seg = (publicSegment ?? brandSlug ?? brandId).toString().trim();
  const publicPath = `${root}/public/${encodeURIComponent(seg)}/campaign/${id}`;

  const snippets = useMemo(() => buildCampaignEmbedSnippets(baseUrl, id), [baseUrl, id]);

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
              : "border-slate-200/80 bg-gradient-to-br from-slate-50 to-white"
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
                    ? "Use the snippets below on your marketing site, store, CMS, tag manager, or legacy PHP app. Placement comes from your "
                    : "Copy embed snippets for your stack. Configure placement in "}
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
                "shrink-0 gap-1.5"
              )}
            >
              <LayoutDashboardIcon className="size-4" />
              Fine-tune widget
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-700 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="font-medium text-slate-900">Public campaign page:</span>
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-brand underline-offset-2 hover:underline sm:text-sm"
            >
              {publicPath.replace(/^https?:\/\//, "")}
              <ExternalLinkIcon className="size-3.5 shrink-0 opacity-70" />
            </a>
          </div>
          {isPostCreate && (
            <p className="mt-3 text-xs text-slate-500">
              Classic Referrals.com (CodeIgniter) installs sometimes expose URLs like{" "}
              <code className="rounded bg-slate-100 px-1">/public/your-site/campaign/{id}</code> —
              same campaign id; widget endpoints below apply when this domain serves the widget API.
            </p>
          )}
        </div>
      )}

      {layout === "sections" ? (
        <IntegrationEmbedSections snippets={snippets} brandId={brandId} campaignId={id} />
      ) : (
        <Tabs defaultValue="javascript">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-slate-100/80 p-1.5">
            <TabsTrigger value="javascript" className="text-xs sm:text-sm">
              JavaScript
            </TabsTrigger>
            <TabsTrigger value="iframe" className="text-xs sm:text-sm">
              iframe
            </TabsTrigger>
            <TabsTrigger value="nextjs" className="text-xs sm:text-sm">
              Next.js
            </TabsTrigger>
            <TabsTrigger value="wordpress" className="text-xs sm:text-sm">
              WordPress
            </TabsTrigger>
            <TabsTrigger value="shopify" className="text-xs sm:text-sm">
              Shopify
            </TabsTrigger>
            <TabsTrigger value="wix" className="text-xs sm:text-sm">
              Wix
            </TabsTrigger>
            <TabsTrigger value="codeigniter" className="text-xs sm:text-sm">
              PHP / CI
            </TabsTrigger>
            <TabsTrigger value="react" className="text-xs sm:text-sm">
              React (CRA/Vite)
            </TabsTrigger>
            <TabsTrigger value="webflow" className="text-xs sm:text-sm">
              Webflow
            </TabsTrigger>
            <TabsTrigger value="squarespace" className="text-xs sm:text-sm">
              Squarespace
            </TabsTrigger>
            <TabsTrigger value="gtm" className="text-xs sm:text-sm">
              GTM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="javascript" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Recommended: one script tag loads configuration and injects the widget (embed, popup,
              or floating) from your{" "}
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
              Paste anywhere HTML is accepted — landing pages, CMS blocks, email-safe pages (where
              iframes are allowed).
            </p>
            <CodeBlock
              code={snippets.iframe}
              onCopy={() => void copy(snippets.iframe, "iframe")}
              copied={copiedKey === "iframe"}
            />
          </TabsContent>

          <TabsContent value="nextjs" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Use a client component so the iframe stays client-only, or wrap the snippet in{" "}
              <code className="rounded bg-slate-100 px-1">dangerouslySetInnerHTML</code> for the outer
              div + script if you prefer the loader.
            </p>
            <CodeBlock
              code={snippets.next}
              onCopy={() => void copy(snippets.next, "next")}
              copied={copiedKey === "next"}
            />
          </TabsContent>

          <TabsContent value="wordpress" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Custom HTML block (Gutenberg), or enqueue in{" "}
              <code className="rounded bg-slate-100 px-1">footer.php</code> with{" "}
              <code className="rounded bg-slate-100 px-1">wp_enqueue_script</code> pointing at the
              script URL if your policy blocks inline scripts.
            </p>
            <CodeBlock
              code={snippets.wordpress}
              onCopy={() => void copy(snippets.wordpress, "wp")}
              copied={copiedKey === "wp"}
            />
          </TabsContent>

          <TabsContent value="shopify" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Online Store → Themes → Edit code →{" "}
              <code className="rounded bg-slate-100 px-1">theme.liquid</code> → before{" "}
              <code className="rounded bg-slate-100 px-1">&lt;/body&gt;</code>. Test in a duplicate
              theme first.
            </p>
            <CodeBlock
              code={snippets.shopify}
              onCopy={() => void copy(snippets.shopify, "shopify")}
              copied={copiedKey === "shopify"}
            />
          </TabsContent>

          <TabsContent value="wix" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Add an HTML iframe embed element (or Velo HTML component). Prefer the iframe snippet
              if Velo strips inline scripts.
            </p>
            <CodeBlock
              code={snippets.wix}
              onCopy={() => void copy(snippets.wix, "wix")}
              copied={copiedKey === "wix"}
            />
          </TabsContent>

          <TabsContent value="codeigniter" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Original Referrals.com stack: drop the loader into your shared layout/footer view. Use
              the absolute <code className="rounded bg-slate-100 px-1">script src</code> if your CI
              app is on another host than the widget API.
            </p>
            <CodeBlock
              code={snippets.codeigniter}
              onCopy={() => void copy(snippets.codeigniter, "ci")}
              copied={copiedKey === "ci"}
            />
          </TabsContent>

          <TabsContent value="react" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Create React App, Vite + React, or any SPA: mount a small component wherever you want
              the widget. For a global floating button, use the JavaScript tab instead and add the
              snippet to <code className="rounded bg-slate-100 px-1">index.html</code>.
            </p>
            <CodeBlock
              code={snippets.react}
              onCopy={() => void copy(snippets.react, "react")}
              copied={copiedKey === "react"}
            />
          </TabsContent>

          <TabsContent value="webflow" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Designer: <strong className="font-medium text-foreground">Add</strong> →{" "}
              <strong className="font-medium text-foreground">Embed</strong> →{" "}
              <strong className="font-medium text-foreground">HTML embed</strong> → paste → Publish.
              If Webflow strips <code className="rounded bg-slate-100 px-1">&lt;script&gt;</code>,
              use only the iframe block from the snippet (delete the script block).
            </p>
            <CodeBlock
              code={snippets.webflow}
              onCopy={() => void copy(snippets.webflow, "webflow")}
              copied={copiedKey === "webflow"}
            />
          </TabsContent>

          <TabsContent value="squarespace" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Edit the page → <strong className="font-medium text-foreground">+</strong> →{" "}
              <strong className="font-medium text-foreground">Code</strong> (not Markdown) → paste
              the iframe. Code injection (Settings → Advanced) is another option for site-wide
              footer embeds; duplicate the site before testing.
            </p>
            <CodeBlock
              code={snippets.squarespace}
              onCopy={() => void copy(snippets.squarespace, "sqsp")}
              copied={copiedKey === "sqsp"}
            />
          </TabsContent>

          <TabsContent value="gtm" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">Tags</strong> →{" "}
              <strong className="font-medium text-foreground">New</strong> →{" "}
              <strong className="font-medium text-foreground">Tag Configuration</strong> →{" "}
              <strong className="font-medium text-foreground">Custom HTML</strong> → paste → choose a
              trigger (e.g. All Pages). Some workspaces restrict external{" "}
              <code className="rounded bg-slate-100 px-1">script src</code>; if the tag fails
              validation, use the iframe-only variant below.
            </p>
            <CodeBlock
              code={snippets.gtm}
              onCopy={() => void copy(snippets.gtm, "gtm")}
              copied={copiedKey === "gtm"}
            />
            <p className="text-sm font-medium text-foreground">Iframe-only (stricter GTM policies)</p>
            <CodeBlock
              code={snippets.gtmIframeOnly}
              onCopy={() => void copy(snippets.gtmIframeOnly, "gtm-if")}
              copied={copiedKey === "gtm-if"}
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
              "inline-flex justify-center"
            )}
          >
            Open campaign dashboard
          </Link>
          <Link
            href={`/brands/${brandId}/campaigns`}
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "inline-flex justify-center"
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
    <div className="relative rounded-xl border border-slate-200 bg-slate-950 text-slate-100 shadow-inner">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="absolute right-2 top-2 z-[1] h-8 gap-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
        onClick={onCopy}
      >
        <CopyIcon className="size-3.5" />
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre className="max-h-[min(70vh,420px)] overflow-auto p-4 pr-24 text-xs leading-relaxed sm:text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}
