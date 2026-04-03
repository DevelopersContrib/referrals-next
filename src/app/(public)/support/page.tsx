import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Referrals.com. Browse our knowledgebase, contact support, or submit feedback.",
  openGraph: { title: "Support | Referrals.com", description: "Get help with Referrals.com.", url: "https://referrals.com/support" },
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center">Support Center</h1>
      <p className="mt-4 text-center text-lg text-gray-600">
        We&apos;re here to help you get the most out of Referrals.com.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/knowledgebase" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold">Knowledgebase</h3>
          <p className="mt-2 text-sm text-gray-600">Browse guides, tutorials, and FAQs to learn how to use every feature.</p>
        </Link>
        <Link href="/contact" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold">Contact Us</h3>
          <p className="mt-2 text-sm text-gray-600">Reach out to our support team directly. We typically respond within 24 hours.</p>
        </Link>
        <Link href="/feedback" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold">Feedback</h3>
          <p className="mt-2 text-sm text-gray-600">Share your ideas, feature requests, and suggestions to help us improve.</p>
        </Link>
        <Link href="/community" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold">Community</h3>
          <p className="mt-2 text-sm text-gray-600">Join the Referrals.com community. Connect with other users and share tips.</p>
        </Link>
        <Link href="/developer" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold">Developer Docs</h3>
          <p className="mt-2 text-sm text-gray-600">REST API documentation, webhooks, and integration guides for developers.</p>
        </Link>
        <Link href="/forum" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold">Forum</h3>
          <p className="mt-2 text-sm text-gray-600">Ask questions, get answers, and discuss referral marketing strategies.</p>
        </Link>
      </div>
    </div>
  );
}
