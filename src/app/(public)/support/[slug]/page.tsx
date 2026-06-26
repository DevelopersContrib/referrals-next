import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	getArticleBySlug,
	getAllArticleSlugs,
	getRelatedArticles,
} from "@/lib/knowledgebase-articles";

type PageProps = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	return getAllArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const article = getArticleBySlug(slug);
	if (!article) return { title: "Article Not Found" };

	return {
		title: article.title,
		description: article.description,
		openGraph: {
			title: `${article.title} | Referrals.com Support`,
			description: article.description,
			url: `https://referrals.com/support/${slug}`,
		},
	};
}

export default async function SupportArticlePage({ params }: PageProps) {
	const { slug } = await params;
	const article = getArticleBySlug(slug);
	if (!article) notFound();

	const related = getRelatedArticles(slug);

	return (
		<div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
			<nav className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
				<Link href="/" className="hover:text-brand">
					Home
				</Link>
				<span>/</span>
				<Link href="/support" className="hover:text-brand">
					Support
				</Link>
				<span>/</span>
				<span className="text-gray-400">{article.category}</span>
				<span>/</span>
				<span className="font-medium text-gray-700">{article.title}</span>
			</nav>

			<div className="grid gap-10 lg:grid-cols-[1fr_240px]">
				<article>
					<p className="text-sm font-medium text-brand">{article.category}</p>
					<h1 className="mt-2 text-3xl font-bold text-gray-900">
						{article.title}
					</h1>
					<div className="prose prose-slate mt-8 max-w-none">
						{article.paragraphs.map((paragraph, i) => (
							<p key={i}>{paragraph}</p>
						))}
					</div>
					<div className="mt-10 border-t pt-6">
						<Link
							href="/support"
							className="text-sm font-medium text-brand hover:underline"
						>
							&larr; Back to Support
						</Link>
					</div>
				</article>

				{related.length > 0 && (
					<aside className="lg:sticky lg:top-8 lg:self-start">
						<h2 className="text-sm font-semibold text-gray-900">
							Related articles
						</h2>
						<ul className="mt-3 space-y-2">
							{related.map((rel) => (
								<li key={rel.slug}>
									<Link
										href={`/support/${rel.slug}`}
										className="text-sm text-gray-600 hover:text-brand hover:underline"
									>
										{rel.title}
									</Link>
								</li>
							))}
						</ul>
					</aside>
				)}
			</div>
		</div>
	);
}
