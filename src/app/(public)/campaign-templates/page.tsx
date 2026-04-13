import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Campaign Templates",
  description: "Explore our ready-made referral campaign templates. Social rewards, voting, gamification, and more — launch in minutes.",
  openGraph: { title: "Campaign Templates | Referrals.com", description: "Ready-made referral campaign templates.", url: "https://referrals.com/campaign-templates" },
};

const templates = [
  { title: "Social Instant Reward", desc: "Reward participants instantly when they share on social media. Perfect for quick viral campaigns.", tag: "Free", color: "bg-[#FF5C62]" },
  { title: "Token Reward", desc: "Distribute crypto tokens as rewards for referrals. Ideal for Web3 projects and blockchain communities.", tag: "Premium", color: "bg-[#926efb]" },
  { title: "Download Giveaway", desc: "Offer free downloads (ebooks, guides, software) in exchange for referrals and signups.", tag: "Free", color: "bg-[#FF5C62]" },
  { title: "Photo Voting", desc: "Run photo contests where participants submit photos and friends vote. Great for engagement.", tag: "Premium", color: "bg-[#926efb]" },
  { title: "Poll Campaign", desc: "Create polls and surveys that participants share with their network. Collect data while growing.", tag: "Free", color: "bg-[#FF5C62]" },
  { title: "Closed Beta", desc: "Build exclusivity with invite-only beta access. Participants earn early access by referring friends.", tag: "Premium", color: "bg-[#926efb]" },
  { title: "Info Bar", desc: "Non-intrusive notification bar at the top of your site. Promotes your referral program to every visitor.", tag: "Free", color: "bg-[#FF5C62]" },
  { title: "Full Page Takeover", desc: "Maximum impact landing page that converts visitors into referral participants. Highest conversion rate.", tag: "Premium", color: "bg-[#926efb]" },
];

export default function CampaignTemplatesPage() {
  return (
    <div>
      {/* Breadcrumb Hero */}
      <section className="public-hero border-b border-white/10 overflow-x-hidden lg:overflow-visible">
        <div className="mx-auto min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-[#FF5C62]">Explore Our</p>
          <h1 className="mt-2 text-[1.65rem] font-bold leading-tight min-[380px]:text-[1.85rem] sm:text-4xl md:text-5xl">
            Campaign Templates
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:mt-4 sm:text-base md:text-lg">
            Choose from our library of proven referral campaign templates. Each template is fully customizable and optimized for maximum conversions.
          </p>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((template) => (
              <div key={template.title} className="group rounded-xl border border-white/10 bg-[#292A2D] overflow-hidden transition-all hover:border-[#FF5C62]/30 hover:shadow-xl hover:shadow-[#FF5C62]/5">
                {/* Image placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-[#292A2D] to-[#212529] flex items-center justify-center">
                  <div className="text-4xl opacity-20">📋</div>
                  <span className={`absolute top-3 right-3 ${template.color} px-2 py-0.5 rounded-full text-xs font-medium text-white`}>
                    {template.tag}
                  </span>
                </div>
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-white">{template.title}</h3>
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">{template.desc}</p>
                  {/* Rating */}
                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white">
                      Preview
                    </button>
                    <Link href="/signup" className="flex-1 rounded-lg bg-[#FF5C62] px-3 py-2 text-center text-xs font-medium text-white transition-all hover:bg-[#ff4f58]">
                      Select
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Can&apos;t find what you need?</h2>
          <p className="mt-4 text-gray-400">Create a fully custom campaign from scratch with our powerful campaign builder.</p>
          <Link href="/signup" className="mt-6 inline-block rounded-lg bg-[#FF5C62] px-8 py-3 font-medium text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25">
            Build Custom Campaign
          </Link>
        </div>
      </section>
    </div>
  );
}
