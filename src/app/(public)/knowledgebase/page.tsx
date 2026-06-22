import type { Metadata } from "next";
import Link from "next/link";
import { knowledgebaseCategories } from "@/lib/knowledgebase-articles";

export const metadata: Metadata = {
	title: "Knowledgebase",
	description:
		"Learn how to use Referrals.com with our guides, tutorials, and frequently asked questions.",
	openGraph: {
		title: "Knowledgebase | Referrals.com",
		description: "Guides, tutorials, and FAQs for Referrals.com.",
		url: "https://referrals.com/knowledgebase",
	},
};

export default function KnowledgebasePage() {
	return (
		<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
			<h1 className="text-center text-4xl font-bold">Knowledgebase</h1>
			<p className="mt-4 text-center text-lg text-gray-600">
				Everything you need to know about Referrals.com.
			</p>

			<div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
				{knowledgebaseCategories.map((cat) => (
					<div key={cat.title} className="rounded-xl border bg-white p-6">
						<h2 className="mb-4 text-lg font-semibold">{cat.title}</h2>
						<ul className="space-y-2">
							{cat.articles.map((article) => (
								<li key={article.slug}>
									<Link
										href={`/knowledgebase/${article.slug}`}
										className="text-sm text-brand hover:underline"
									>
										{article.title}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>

			<div className="mt-12 text-center">
				<p className="text-gray-600">
					Can&apos;t find what you&apos;re looking for?
				</p>
				<Link
					href="/contact"
					className="mt-2 inline-block font-medium text-brand hover:underline"
				>
					Contact Support
				</Link>
			</div>
		</div>
	);
}
