"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ShareButtons } from "@/components/widget/share-buttons";

export default function SignupSharePage() {
  return (
    <Suspense>
      <SignupShareContent />
    </Suspense>
  );
}

function SignupShareContent() {
  const searchParams = useSearchParams();
  const referralUrl =
    searchParams.get("ref") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const campaignId = parseInt(searchParams.get("campaignId") || "0", 10);
  const participantId = parseInt(
    searchParams.get("participantId") || "0",
    10
  );

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <head>
        <title>Share Your Referral Link | Referrals.com</title>
        <meta
          name="description"
          content="Share your unique referral link with friends and earn rewards."
        />
      </head>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          {/* Success icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <svg
              className="h-10 w-10 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            You&apos;re In!
          </h1>
          <p className="mt-3 text-gray-400">
            Share your unique referral link below to earn rewards for every
            friend who joins.
          </p>

          {/* Referral Link */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#292A2D] p-6">
            <p className="mb-3 text-sm font-medium text-gray-300">
              Your Referral Link
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#212529] px-4 py-3">
              <span className="flex-1 truncate text-sm text-white">
                {referralUrl || "Loading your referral link..."}
              </span>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 rounded-md bg-[#FF5C62] px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#ff4f58]"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mt-8">
            <p className="mb-4 text-sm font-medium text-gray-300">
              Share via Social Media
            </p>
            {campaignId > 0 && participantId > 0 ? (
              <ShareButtons
                campaignId={campaignId}
                participantId={participantId}
                shareUrl={referralUrl}
                shareText="Join me on this awesome referral program!"
                shareTitle="Referral Invitation"
              />
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  {
                    name: "Twitter",
                    color: "#000",
                    url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent("Join me on this awesome referral program!")}`,
                  },
                  {
                    name: "Facebook",
                    color: "#1877F2",
                    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
                  },
                  {
                    name: "LinkedIn",
                    color: "#0A66C2",
                    url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
                  },
                  {
                    name: "WhatsApp",
                    color: "#25D366",
                    url: `https://wa.me/?text=${encodeURIComponent("Join me on this awesome referral program! " + referralUrl)}`,
                  },
                  {
                    name: "Email",
                    color: "#6B7280",
                    url: `mailto:?subject=${encodeURIComponent("Join my referral program")}&body=${encodeURIComponent("Hey! Check out this referral program: " + referralUrl)}`,
                  },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target={social.name === "Email" ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
                    style={{ backgroundColor: social.color }}
                  >
                    {social.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Reward info */}
          <div className="mt-10 rounded-2xl border border-[#FF5C62]/20 bg-[#FF5C62]/5 p-6">
            <h3 className="font-semibold text-[#FF5C62]">
              How Rewards Work
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              For every friend who signs up using your referral link, you will
              earn a reward. The more friends you invite, the bigger your rewards
              get!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
