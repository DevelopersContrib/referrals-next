"use client";

import { CopyToClipboardButton } from "@/components/ui/copy-to-clipboard-button";
import { ExternalLinkIcon, LinkIcon } from "lucide-react";
import Link from "next/link";

function pathnameFromAbsolute(url: string) {
  try {
    return new URL(url).pathname + new URL(url).search;
  } catch {
    return url;
  }
}

export function CampaignShareLinks({
  referralUrl,
  publicPageUrl,
}: {
  referralUrl: string;
  publicPageUrl: string;
}) {
  const publicPath = pathnameFromAbsolute(publicPageUrl);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a7abc3]">
          Referral link
        </label>
        <div className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center rounded-md border border-[#ebeef0] bg-[#f7f8fa] px-3 text-sm text-[#575962]">
            <LinkIcon className="mr-2 size-3.5 shrink-0 text-[#a7abc3]" />
            <span className="truncate">{referralUrl}</span>
          </div>
          <CopyToClipboardButton text={referralUrl} aria-label="Copy referral link" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a7abc3]">
          Public campaign page
        </label>
        <div className="flex items-center gap-2">
          <Link
            href={publicPath}
            className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-[#ebeef0] bg-[#f7f8fa] px-3 text-sm text-[#575962] hover:border-brand/40"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLinkIcon className="mr-2 size-3.5 shrink-0 text-[#a7abc3]" />
            <span className="truncate">{publicPageUrl}</span>
          </Link>
          <CopyToClipboardButton text={publicPageUrl} aria-label="Copy public page URL" />
        </div>
      </div>
    </div>
  );
}
