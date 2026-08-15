"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

type Props = {
  shareUrl: string;
  campaignId?: number;
  participantId?: number;
  compact?: boolean;
};

const SHARE_TEXT =
  "I just started a 14-day Growth trial on Referrals.com — launch a referral program with no credit card:";

export function SignupInviteCard({
  shareUrl,
  campaignId,
  participantId,
  compact = false,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }

    if (campaignId && participantId) {
      void fetch("/api/widget/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          participantId,
          socialType: "copy",
        }),
      }).catch(() => {
        /* tracking is best-effort */
      });
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${SHARE_TEXT} ${shareUrl}`);

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-left"
          : "mt-5 rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-left"
      }
    >
      <p className="text-sm font-semibold text-gray-900">
        Invite a business — earn 30 days of Growth
      </p>
      <p className="mt-1 text-xs text-gray-600">
        When they upgrade to paid Growth, you get a free month. Share your link
        now — you don&apos;t have to wait.
      </p>
      <div className="mt-3 flex min-h-11 items-stretch gap-2">
        <input
          readOnly
          value={shareUrl}
          className="min-w-0 flex-1 rounded-lg border border-rose-200 bg-white px-3 text-xs text-gray-800"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-[#FF5C62] px-3 text-xs font-semibold text-white hover:bg-[#ff4f58]"
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(SHARE_TEXT)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-rose-50"
        >
          Share on X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-rose-50"
        >
          LinkedIn
        </a>
        <a
          href={`https://wa.me/?text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-rose-50"
        >
          WhatsApp
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent("Try Referrals.com with me")}&body=${encodedText}`}
          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-rose-50"
        >
          Email
        </a>
      </div>
    </div>
  );
}
