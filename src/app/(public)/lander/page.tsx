"use client";

import Link from "next/link";

export default function LanderDefaultPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Join Our Referral Program
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-gray-400">
          Share with your friends and earn rewards. The more you share, the more
          you earn.
        </p>

        <div className="mt-8">
          <form
            className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="flex-1 rounded-lg border border-white/10 bg-[#292A2D] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#FF5C62]/50 focus:ring-1 focus:ring-[#FF5C62]/50"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#FF5C62] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25"
            >
              Get Started
            </button>
          </form>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-[#FF5C62]">10K+</div>
            <div className="mt-1 text-sm text-gray-400">Active Members</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#FF5C62]">50K+</div>
            <div className="mt-1 text-sm text-gray-400">Referrals Made</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#FF5C62]">$100K+</div>
            <div className="mt-1 text-sm text-gray-400">Rewards Earned</div>
          </div>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          Powered by{" "}
          <Link href="/" className="text-[#FF5C62] hover:underline">
            Referrals.com
          </Link>
        </p>
      </div>
    </div>
  );
}
