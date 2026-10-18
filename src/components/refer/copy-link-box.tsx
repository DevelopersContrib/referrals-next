"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { copyText } from "@/lib/clipboard";

export function CopyLinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 p-2 backdrop-blur">
      <code className="min-w-0 flex-1 truncate px-2 text-sm text-white">{url}</code>
      <button
        type="button"
        onClick={async () => {
          if (await copyText(url)) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }
        }}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold text-[#d63a40] shadow-sm transition hover:bg-rose-50"
      >
        {copied ? <CheckIcon className="size-4" aria-hidden="true" /> : <CopyIcon className="size-4" aria-hidden="true" />}
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
