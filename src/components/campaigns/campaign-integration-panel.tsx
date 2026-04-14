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

function trimBase(url: string) {
  return url.replace(/\/+$/, "");
}

export interface CampaignIntegrationPanelProps {
  campaignId: number;
  brandId: string;
  baseUrl: string;
  brandSlug?: string | null;
}

export function CampaignIntegrationPanel({
  campaignId,
  brandId,
  baseUrl,
  brandSlug,
}: CampaignIntegrationPanelProps) {
  const root = useMemo(() => trimBase(baseUrl || "https://referrals.com"), [baseUrl]);
  const id = campaignId;
  const publicPath =
    brandSlug && brandSlug.trim().length > 0
      ? `${root}/p/${encodeURIComponent(brandSlug.trim())}/campaign/${id}`
      : null;

  const jsSnippet = `<div id="referrals-widget"></div>
<script src="${root}/api/widget/js/${id}" async></script>`;

  const iframeSnippet = `<iframe
  src="${root}/widget/${id}/embed"
  title="Referral program"
  width="100%"
  height="560"
  style="border:0;max-width:100%;"
  loading="lazy"
  allow="clipboard-write; clipboard-read"
></iframe>`;

  const nextSnippet = `"use client";

const WIDGET_SRC = "${root}/widget/${id}/embed";

export function ReferralWidget() {
  return (
    <iframe
      src={WIDGET_SRC}
      title="Referral program"
      width="100%"
      height={560}
      className="max-w-full border-0"
      loading="lazy"
      allow="clipboard-write; clipboard-read"
    />
  );
}`;

  const wordpressSnippet = `<!-- WordPress: Custom HTML block, or add to your theme footer -->
${jsSnippet}`;

  const shopifySnippet = `<!-- Shopify: Online Store → Themes → … → Edit code → theme.liquid → before </body> -->
${jsSnippet}`;

  const wixSnippet = `<!-- Wix: Add an "Embed HTML" / Velo element and paste: -->
${iframeSnippet}`;

  const codeigniterSnippet = `<!-- CodeIgniter 3/4: in application/views/templates/footer.php (or layout) before </body> -->
<?php $campaignId = ${id}; ?>
<div id="referrals-widget"></div>
<script src="<?= base_url('api/widget/js/' . $campaignId) ?>" async></script>
<!-- If base_url() points at your referrals host, use the absolute script URL instead: -->
<!-- <script src="${root}/api/widget/js/${id}" async></script> -->`;

  const reactCraSnippet = `// src/components/ReferralWidget.jsx — CRA, Vite, or any React SPA
export function ReferralWidget() {
  const src = "${root}/widget/${id}/embed";
  return (
    <iframe
      src={src}
      title="Referral program"
      width="100%"
      height={560}
      style={{ border: 0, maxWidth: "100%" }}
      loading="lazy"
      allow="clipboard-write; clipboard-read"
    />
  );
}

// In App.jsx (or a page):
// import { ReferralWidget } from "./components/ReferralWidget";
// <ReferralWidget />`;

  const webflowSnippet = `<!-- Webflow: Add panel → Embed → "HTML embed" → paste, then Publish.
     Prefer iframe if the Designer strips external <script> tags. -->
${iframeSnippet}

<!-- Alternative: JS loader (inline / popup / floating from widget settings) -->
${jsSnippet}`;

  const squarespaceSnippet = `<!-- Squarespace 7.1: Edit page → + → Code → paste (Business plan or higher may be required for code blocks on some sites).
     Use iframe for best compatibility. -->
${iframeSnippet}`;

  const gtmSnippet = `<!-- Google Tag Manager → Tags → New → Custom HTML → paste below
     Trigger: All Pages (or DOM Ready / Consent Initialization if you use consent mode).
     If GTM blocks external scripts, use an iframe-only snippet in Custom HTML instead. -->
${jsSnippet}`;

  const gtmIframeOnlySnippet = `<!-- GTM Custom HTML tag — iframe only (when <script src> is blocked) -->
${iframeSnippet}`;

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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/60 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
              <CheckCircle2Icon className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                Campaign created — add it to your site
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Use the snippets below on your marketing site, store, CMS, tag manager, or legacy
                PHP app. The loader script reads placement (inline, popup, or floating) from your{" "}
                <Link
                  href={`/brands/${brandId}/campaigns/${id}/widget`}
                  className="font-medium text-brand underline-offset-2 hover:underline"
                >
                  widget settings
                </Link>
                .
              </p>
            </div>
          </div>
          <Link
            href={`/brands/${brandId}/campaigns/${id}/widget`}
            className={cn(buttonVariants({ variant: "default", size: "default" }), "shrink-0 gap-1.5")}
          >
            <LayoutDashboardIcon className="size-4" />
            Fine-tune widget
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-700 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="font-medium text-slate-900">Shareable landing page (this app):</span>
          {publicPath ? (
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-brand underline-offset-2 hover:underline sm:text-sm"
            >
              {publicPath.replace(/^https?:\/\//, "")}
              <ExternalLinkIcon className="size-3.5 shrink-0 opacity-70" />
            </a>
          ) : (
            <span className="text-slate-500">
              Set a brand slug under brand settings to get a clean{" "}
              <code className="rounded bg-slate-100 px-1">/p/your-brand/campaign/…</code> URL.
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Classic Referrals.com (CodeIgniter) installs sometimes expose URLs like{" "}
          <code className="rounded bg-slate-100 px-1">/public/your-site/campaign/{id}</code> — same
          campaign id; widget endpoints below still apply when the domain serves this widget API.
        </p>
      </div>

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
            code={jsSnippet}
            onCopy={() => void copy(jsSnippet, "js")}
            copied={copiedKey === "js"}
          />
        </TabsContent>

        <TabsContent value="iframe" className="mt-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste anywhere HTML is accepted — landing pages, CMS blocks, email-safe pages (where
            iframes are allowed).
          </p>
          <CodeBlock
            code={iframeSnippet}
            onCopy={() => void copy(iframeSnippet, "iframe")}
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
            code={nextSnippet}
            onCopy={() => void copy(nextSnippet, "next")}
            copied={copiedKey === "next"}
          />
        </TabsContent>

        <TabsContent value="wordpress" className="mt-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            Custom HTML block (Gutenberg), or enqueue in <code className="rounded bg-slate-100 px-1">footer.php</code>{" "}
            with <code className="rounded bg-slate-100 px-1">wp_enqueue_script</code> pointing at the
            script URL if your policy blocks inline scripts.
          </p>
          <CodeBlock
            code={wordpressSnippet}
            onCopy={() => void copy(wordpressSnippet, "wp")}
            copied={copiedKey === "wp"}
          />
        </TabsContent>

        <TabsContent value="shopify" className="mt-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            Online Store → Themes → Edit code → <code className="rounded bg-slate-100 px-1">theme.liquid</code> →
            before <code className="rounded bg-slate-100 px-1">&lt;/body&gt;</code>. Test in a
            duplicate theme first.
          </p>
          <CodeBlock
            code={shopifySnippet}
            onCopy={() => void copy(shopifySnippet, "shopify")}
            copied={copiedKey === "shopify"}
          />
        </TabsContent>

        <TabsContent value="wix" className="mt-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            Add an HTML iframe embed element (or Velo HTML component). Prefer the iframe snippet if
            Velo strips inline scripts.
          </p>
          <CodeBlock
            code={wixSnippet}
            onCopy={() => void copy(wixSnippet, "wix")}
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
            code={codeigniterSnippet}
            onCopy={() => void copy(codeigniterSnippet, "ci")}
            copied={copiedKey === "ci"}
          />
        </TabsContent>

        <TabsContent value="react" className="mt-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            Create React App, Vite + React, or any SPA: mount a small component wherever you want the
            widget. For a global floating button, use the JavaScript tab instead and add the snippet
            to <code className="rounded bg-slate-100 px-1">index.html</code>.
          </p>
          <CodeBlock
            code={reactCraSnippet}
            onCopy={() => void copy(reactCraSnippet, "react")}
            copied={copiedKey === "react"}
          />
        </TabsContent>

        <TabsContent value="webflow" className="mt-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            Designer: <strong className="font-medium text-foreground">Add</strong> →{" "}
            <strong className="font-medium text-foreground">Embed</strong> →{" "}
            <strong className="font-medium text-foreground">HTML embed</strong> → paste → Publish.
            If Webflow strips <code className="rounded bg-slate-100 px-1">&lt;script&gt;</code>, use
            only the iframe block from the snippet (delete the script block).
          </p>
          <CodeBlock
            code={webflowSnippet}
            onCopy={() => void copy(webflowSnippet, "webflow")}
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
            code={squarespaceSnippet}
            onCopy={() => void copy(squarespaceSnippet, "sqsp")}
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
            <code className="rounded bg-slate-100 px-1">script src</code>; if the tag fails validation,
            use the iframe-only variant below.
          </p>
          <CodeBlock
            code={gtmSnippet}
            onCopy={() => void copy(gtmSnippet, "gtm")}
            copied={copiedKey === "gtm"}
          />
          <p className="text-sm font-medium text-foreground">Iframe-only (stricter GTM policies)</p>
          <CodeBlock
            code={gtmIframeOnlySnippet}
            onCopy={() => void copy(gtmIframeOnlySnippet, "gtm-if")}
            copied={copiedKey === "gtm-if"}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/brands/${brandId}/campaigns/${id}`}
          className={cn(buttonVariants({ variant: "outline", size: "default" }), "inline-flex justify-center")}
        >
          Open campaign dashboard
        </Link>
        <Link
          href={`/brands/${brandId}/campaigns`}
          className={cn(buttonVariants({ variant: "default", size: "default" }), "inline-flex justify-center")}
        >
          Back to all campaigns
        </Link>
      </div>
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
