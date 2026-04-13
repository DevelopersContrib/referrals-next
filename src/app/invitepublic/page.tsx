"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface CampaignData {
  id: number;
  name: string;
  brand: { name: string; slug: string };
}

function InvitePublicContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const campaignId = searchParams.get("campaign");
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    if (!campaignId) return;
    fetch(`/api/v1/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((data) => setCampaign(data))
      .catch(() => {});
  }, [campaignId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/widget/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, campaignId, ref }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-white mb-2">You&apos;re In!</h1>
        <p className="text-gray-400 mb-6">
          You&apos;ve successfully joined{campaign ? ` ${campaign.name}` : " the referral program"}.
          Check your email for your unique referral link.
        </p>
        {campaign && (
          <Link
            href={`/p/${campaign.brand.slug}/campaign/${campaign.id}`}
            className="bg-[#926efb] hover:bg-[#7c5be8] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            View Campaign
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {campaign ? `Join ${campaign.name}` : "Join the Referral Program"}
        </h1>
        <p className="text-gray-400">
          {campaign
            ? `You were invited to join ${campaign.brand.name}'s referral campaign`
            : "Enter your email to join and start earning rewards"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-[#1a1b1e] border border-[#3a3b3e] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#926efb] transition-colors"
          />
        </div>
        {status === "error" && (
          <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-[#FF5C62] hover:bg-[#e54e54] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {status === "submitting" ? "Joining..." : "Join & Get My Referral Link"}
        </button>
      </form>

      <p className="text-center text-gray-500 text-xs mt-6">
        By joining, you agree to our{" "}
        <Link href="/terms" className="text-[#926efb] hover:underline">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-[#926efb] hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function InvitePublicPage() {
  return (
    <div className="min-h-screen bg-[#212529] flex items-center justify-center px-4">
      <div className="bg-[#292A2D] rounded-2xl p-10 max-w-md w-full border border-[#3a3b3e]">
        <Suspense fallback={
          <div className="flex justify-center">
            <div className="w-10 h-10 border-4 border-[#926efb] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <InvitePublicContent />
        </Suspense>
      </div>
    </div>
  );
}
