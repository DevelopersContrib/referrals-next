"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	filterCategoriesBySlugs,
	knowledgebaseCategories,
	searchArticles,
	type KnowledgebaseCategory,
} from "@/lib/knowledgebase-articles";

const secondaryLinks = [
	{
		href: "/contact",
		title: "Contact Us",
		description: "Reach our support team directly. We typically respond within 24 hours.",
	},
	{
		href: "/feedback",
		title: "Feedback",
		description: "Share ideas, feature requests, and suggestions.",
	},
	{
		href: "/developer/docs",
		title: "Developer Docs",
		description: "REST API documentation, webhooks, and integration guides.",
	},
	{
		href: "/forum",
		title: "Forum",
		description: "Ask questions and discuss referral marketing strategies.",
	},
];

type SupportKnowledgebaseProps = {
	categories: KnowledgebaseCategory[];
};

export function SupportKnowledgebase({
	categories: initialCategories,
}: SupportKnowledgebaseProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("q") ?? "";
	const [query, setQuery] = useState(initialQuery);

	const filteredCategories = useMemo(() => {
		const q = query.trim();
		if (!q) return initialCategories;
		const matches = searchArticles(q);
		const slugs = new Set(matches.map((a) => a.slug));
		return filterCategoriesBySlugs(slugs);
	}, [query, initialCategories]);

	const totalResults = useMemo(
		() => filteredCategories.reduce((n, cat) => n + cat.articles.length, 0),
		[filteredCategories]
	);

	const updateQuery = useCallback(
		(value: string) => {
			setQuery(value);
			const params = new URLSearchParams(searchParams.toString());
			if (value.trim()) {
				params.set("q", value.trim());
			} else {
				params.delete("q");
			}
			const qs = params.toString();
			router.replace(qs ? `/support?${qs}` : "/support", { scroll: false });
		},
		[router, searchParams]
	);

	return (
		<>
			<div className="relative mx-auto mt-10 max-w-xl">
				<svg
					className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
					aria-hidden
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
					/>
				</svg>
				<Input
					type="search"
					placeholder="Search articles..."
					value={query}
					onChange={(e) => updateQuery(e.target.value)}
					className="h-11 pl-10 text-base"
					aria-label="Search support articles"
				/>
			</div>

			{query.trim() && (
				<p className="mt-4 text-center text-sm text-gray-500">
					{totalResults === 0
						? "No articles match your search."
						: `${totalResults} article${totalResults === 1 ? "" : "s"} found`}
				</p>
			)}

			{filteredCategories.length > 0 ? (
				<div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
					{filteredCategories.map((cat) => (
						<div key={cat.title} className="rounded-xl border bg-white p-6">
							<h2 className="mb-4 text-lg font-semibold">{cat.title}</h2>
							<ul className="space-y-2">
								{cat.articles.map((article) => (
									<li key={article.slug}>
										<Link
											href={`/support/${article.slug}`}
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
			) : query.trim() ? (
				<div className="mt-10 rounded-xl border bg-white p-8 text-center">
					<p className="text-gray-600">
						Try different keywords or browse all categories below.
					</p>
					<button
						type="button"
						onClick={() => updateQuery("")}
						className="mt-3 text-sm font-medium text-brand hover:underline"
					>
						Clear search
					</button>
				</div>
			) : null}

			<div className="mt-16">
				<h2 className="text-center text-lg font-semibold text-gray-900">
					Need more help?
				</h2>
				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{secondaryLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
						>
							<h3 className="font-semibold">{link.title}</h3>
							<p className="mt-1 text-sm text-gray-600">{link.description}</p>
						</Link>
					))}
				</div>
			</div>

			<div className="mt-12 text-center">
				<p className="text-gray-600">Can&apos;t find what you&apos;re looking for?</p>
				<div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
					<Link
						href="/contact"
						className="font-medium text-brand hover:underline"
					>
						Contact Support
					</Link>
					<span className="text-gray-300" aria-hidden>
						|
					</span>
					<Link
						href="/developer/docs"
						className="font-medium text-brand hover:underline"
					>
						Developer Docs
					</Link>
				</div>
			</div>
		</>
	);
}
