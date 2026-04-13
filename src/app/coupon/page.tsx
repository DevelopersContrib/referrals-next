"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CouponContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const campaignId = searchParams.get("campaign");
  const [coupon, setCoupon] = useState<{ code: string; description?: string } | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "error">("loading");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      return;
    }
    // Claim the coupon reward
    fetch("/api/widget/reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "coupon", code, campaignId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.coupon) {
          setCoupon(data.coupon);
          setStatus("found");
        } else {
          // Show the code directly if passed as param
          setCoupon({ code });
          setStatus("found");
        }
      })
      .catch(() => {
        setCoupon({ code });
        setStatus("found");
      });
  }, [code, campaignId]);

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#926efb] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-400">Loading your reward...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-semibold text-white mb-2">Invalid Coupon Link</h1>
        <p className="text-gray-400 mb-6">This coupon link is invalid or has expired.</p>
        <Link href="/" className="bg-[#FF5C62] hover:bg-[#e54e54] text-white font-semibold px-6 py-3 rounded-lg transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-6xl mb-6">🎁</div>
      <h1 className="text-3xl font-bold text-white mb-2">Congratulations!</h1>
      <p className="text-gray-400 mb-8">You&apos;ve earned a reward coupon</p>

      {coupon?.description && (
        <p className="text-gray-300 mb-6">{coupon.description}</p>
      )}

      <div className="bg-[#1a1b1e] border-2 border-dashed border-[#926efb] rounded-xl p-6 mb-6">
        <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest">Your Coupon Code</p>
        <p className="text-3xl font-bold text-[#926efb] font-mono tracking-widest">{coupon?.code}</p>
      </div>

      <button
        onClick={() => {
          navigator.clipboard.writeText(coupon?.code || "");
        }}
        className="bg-[#926efb] hover:bg-[#7c5be8] text-white font-semibold px-8 py-3 rounded-lg transition-colors mb-4 w-full"
      >
        Copy Code
      </button>

      <p className="text-gray-500 text-sm">
        Save this code and use it at checkout.
      </p>
    </div>
  );
}

export default function CouponPage() {
  return (
    <div className="min-h-screen bg-[#212529] flex items-center justify-center px-4">
      <div className="bg-[#292A2D] rounded-2xl p-10 max-w-md w-full border border-[#3a3b3e]">
        <Suspense fallback={
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#926efb] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        }>
          <CouponContent />
        </Suspense>
      </div>
    </div>
  );
}
