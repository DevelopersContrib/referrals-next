"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { CampaignEmbedSnippets } from "@/lib/campaign-embed-snippets";
import { CampaignPageEmbedPreview } from "@/components/campaigns/campaign-page-embed-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

type SectionDef = {
  id: string;
  title: string;
  description: ReactNode;
  code: string | { label: string; code: string }[];
};

function EmbedCodeBlock({
  code,
  copyKey,
  copiedKey,
  onCopy,
}: {
  code: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-inner">
      <div className="flex items-center justify-end border-b border-slate-800 px-3 py-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 shrink-0 gap-1.5 border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
          onClick={() => onCopy(code, copyKey)}
        >
          <CopyIcon className="size-3.5" />
          {copiedKey === copyKey ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-[min(55vh,360px)] max-w-full overflow-auto overscroll-x-contain p-4 text-xs leading-relaxed sm:text-sm">
        <code className="block">{code}</code>
      </pre>
    </div>
  );
}

export function IntegrationEmbedSections({
  snippets,
  brandId,
  campaignId,
}: {
  snippets: CampaignEmbedSnippets;
  brandId: string;
  campaignId: number;
}) {
  const widgetHref = `/brands/${brandId}/campaigns/${campaignId}/widget`;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }, []);

  const sections: SectionDef[] = useMemo(
    () => [
      {
        id: "javascript",
        title: "JavaScript loader",
        description: (
          <>
            Recommended: one script injects the widget (embed, popup, or
            floating) from your{" "}
            <Link
              href={widgetHref}
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              widget settings
            </Link>
            .
          </>
        ),
        code: snippets.js,
      },
      {
        id: "iframe",
        title: "Embed (iframe)",
        description:
          "Compact widget iframe — paste anywhere HTML is accepted. Use this for a sidebar, blog post, or any page that already has your content.",
        code: snippets.iframe,
      },
      ...(snippets.fullPage
        ? [
            {
              id: "fullpage",
              title: "Full page",
              description: (
                <>
                  Entire public campaign at{" "}
                  <code className="rounded bg-slate-100 px-1">
                    /p/{"{slug}"}/campaign/{campaignId}
                  </code>{" "}
                  — headline, join form, stats, and leaderboard. Best for a
                  dedicated /refer page.
                </>
              ),
              code: snippets.fullPage,
            } satisfies SectionDef,
          ]
        : []),
      {
        id: "node",
        title: "Node.js",
        description: (
          <>
            Server-rendered apps (Express / Fastify / Koa): send a page that
            includes the loader script. Run with{" "}
            <code className="rounded bg-slate-100 px-1">node server.js</code>{" "}
            and open <code className="rounded bg-slate-100 px-1">/refer</code>.
          </>
        ),
        code: snippets.node,
      },
    ],
    [snippets, widgetHref, campaignId],
  );

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <Card
          key={s.id}
          className="overflow-hidden border-slate-200/90 shadow-sm"
        >
          <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-4">
            <CardTitle className="text-base font-semibold text-slate-900">
              {s.title}
            </CardTitle>
            <div className="text-sm text-muted-foreground [&_a]:text-brand">
              {s.description}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {s.id === "fullpage" && snippets.pageUrl ? (
              <CampaignPageEmbedPreview pageUrl={snippets.pageUrl} />
            ) : null}
            {Array.isArray(s.code) ? (
              s.code.map((block) => (
                <div key={block.label}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {block.label}
                  </p>
                  <EmbedCodeBlock
                    code={block.code}
                    copyKey={`${s.id}-${block.label}`}
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                </div>
              ))
            ) : (
              <EmbedCodeBlock
                code={s.code}
                copyKey={s.id}
                copiedKey={copiedKey}
                onCopy={copy}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
