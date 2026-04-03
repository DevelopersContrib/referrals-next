import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Community",
  description: "Join the Referrals.com community. Connect with other referral marketers, share strategies, and grow together.",
  openGraph: { title: "Community | Referrals.com", description: "Join the Referrals.com community.", url: "https://referrals.com/community" },
};

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Referrals.com Community</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Connect with thousands of referral marketers, growth hackers, and business owners who are growing their businesses through word-of-mouth.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Discussion Forum</h2>
          <p className="mt-2 text-gray-600">
            Ask questions, share tips, and discuss referral marketing strategies with the community.
          </p>
          <Link href="/forum" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Visit Forum
          </Link>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Partner Network</h2>
          <p className="mt-2 text-gray-600">
            Find integration partners, agencies, and fellow businesses to collaborate with on referral campaigns.
          </p>
          <Link href="/partners" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Browse Partners
          </Link>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Blog & Insights</h2>
          <p className="mt-2 text-gray-600">
            Read expert articles on referral marketing, growth hacking, and customer advocacy. New posts every week.
          </p>
          <Link href="/blog" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Read Blog
          </Link>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Contribute</h2>
          <p className="mt-2 text-gray-600">
            Become a contributor — write guest posts, build integrations, or become an affiliate partner.
          </p>
          <Link href="/contribute" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Get Involved
          </Link>
        </div>
      </div>
    </div>
  );
}
