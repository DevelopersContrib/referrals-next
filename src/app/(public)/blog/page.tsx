import type { Metadata } from "next";
import Link from "next/link";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { getPaginatedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Referral Marketing Insights",
  description:
    "Tips, strategies, and insights on referral marketing, growth hacking, and word-of-mouth strategies.",
  openGraph: {
    title: "Blog — Referral Marketing Insights | Referrals.com",
    description:
      "Tips, strategies, and insights on referral marketing, growth hacking, and word-of-mouth strategies.",
    url: "https://referrals.com/blog",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog — Referral Marketing Insights | Referrals.com",
    description:
      "Tips, strategies, and insights on referral marketing, growth hacking, and word-of-mouth strategies.",
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const { posts, totalPages } = getPaginatedPosts(currentPage, 9);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="min-w-0 flex-1">
          {/* Page header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Referral Marketing Blog
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Insights, strategies, and guides to grow your business through
              referrals and word-of-mouth.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <p className="text-gray-500">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Post grid */}
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article
                    key={post.slug}
                    className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                          {post.title}
                        </h2>
                      </Link>

                      <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                        <span>{post.readingTime}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2">
                  {currentPage > 1 && (
                    <Link
                      href={`/blog?page=${currentPage - 1}`}
                      className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Link
                        key={page}
                        href={`/blog?page=${page}`}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          page === currentPage
                            ? "bg-blue-600 text-white"
                            : "border text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </Link>
                    )
                  )}

                  {currentPage < totalPages && (
                    <Link
                      href={`/blog?page=${currentPage + 1}`}
                      className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
        <BlogSidebar />
      </div>
    </div>
  );
}
