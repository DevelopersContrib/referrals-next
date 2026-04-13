import Link from "next/link";
import { getRecentPosts } from "@/lib/blog";

export function BlogSidebar() {
  const recentPosts = getRecentPosts(5);

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="sticky top-24 space-y-8">
        <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Recent articles
          </h3>
          <ul className="space-y-3">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block text-sm leading-snug text-gray-700 transition-colors hover:text-brand"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-6">
          <h3 className="mb-2 font-semibold text-gray-900">Stay updated</h3>
          <p className="mb-4 text-sm text-gray-600">
            Get the latest referral marketing insights delivered to your inbox.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Get started free
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Referral Marketing",
              "Growth Hacking",
              "Viral Loops",
              "Customer Advocacy",
              "Word-of-Mouth",
              "Loyalty Programs",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
