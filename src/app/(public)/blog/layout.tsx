import Link from "next/link";
import { getRecentPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog - Referrals.com",
  description:
    "Expert insights on referral marketing, growth hacking, and word-of-mouth strategies to help you grow your business.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const recentPosts = getRecentPosts(5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1">{children}</div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="sticky top-24 space-y-8">
            {/* Recent posts */}
            <div className="rounded-xl border bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Recent Articles
              </h3>
              <ul className="space-y-3">
                {recentPosts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block text-sm text-gray-700 transition-colors hover:text-blue-600"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter CTA */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                Stay Updated
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Get the latest referral marketing insights delivered to your
                inbox.
              </p>
              <Link
                href="/signup"
                className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Get Started Free
              </Link>
            </div>

            {/* Tags */}
            <div className="rounded-xl border bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
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
      </div>
    </div>
  );
}
