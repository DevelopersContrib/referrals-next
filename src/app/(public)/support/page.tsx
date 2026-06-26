import type { Metadata } from "next";
import { Suspense } from "react";
import { SupportKnowledgebase } from "@/components/support/support-knowledgebase";
import { knowledgebaseCategories } from "@/lib/knowledgebase-articles";

export const metadata: Metadata = {
	title: "Support",
	description:
		"Get help with Referrals.com. Search our knowledge base for guides, tutorials, and FAQs on every feature.",
	openGraph: {
		title: "Support | Referrals.com",
		description:
			"Search guides, tutorials, and FAQs for Referrals.com.",
		url: "https://referrals.com/support",
	},
};

export default function SupportPage() {
	return (
		<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
			<h1 className="text-center text-4xl font-bold">Support Center</h1>
			<p className="mt-4 text-center text-lg text-gray-600">
				Search our knowledge base or browse by category to learn how to use
				every Referrals.com feature.
			</p>

			<Suspense fallback={<SupportSearchFallback />}>
				<SupportKnowledgebase categories={knowledgebaseCategories} />
			</Suspense>
		</div>
	);
}

function SupportSearchFallback() {
	return (
		<div className="mx-auto mt-10 max-w-xl">
			<div className="h-11 animate-pulse rounded-lg bg-gray-100" />
			<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
				{knowledgebaseCategories.map((cat) => (
					<div key={cat.title} className="h-48 animate-pulse rounded-xl bg-gray-100" />
				))}
			</div>
		</div>
	);
}
