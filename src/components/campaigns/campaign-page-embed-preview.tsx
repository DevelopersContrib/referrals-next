"use client";

import { ExternalLinkIcon } from "lucide-react";

/**
 * Live preview of the public campaign page as it will appear in a
 * full-page iframe embed. Same-origin in the dashboard, so CSP does
 * not block it; third-party sites use the copied snippet instead.
 */
export function CampaignPageEmbedPreview({ pageUrl }: { pageUrl: string }) {
  if (!pageUrl) return null;

  const hostLabel = pageUrl.replace(/^https?:\/\//, "");

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <figcaption className="flex flex-col gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 truncate text-xs font-medium text-slate-600">
          Live preview
          <span className="ms-2 font-mono font-normal text-slate-400">
            {hostLabel}
          </span>
        </p>
        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-brand underline-offset-2 hover:underline sm:min-h-0 sm:py-1.5"
        >
          Open in new tab
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </a>
      </figcaption>
      <iframe
        src={pageUrl}
        title="Full-page campaign preview"
        className="h-[min(70dvh,32rem)] w-full border-0 bg-white"
        loading="lazy"
        allow="clipboard-write; clipboard-read"
      />
    </figure>
  );
}
