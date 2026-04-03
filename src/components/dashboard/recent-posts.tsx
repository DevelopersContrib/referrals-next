import Link from "next/link";
import { getRecentPosts } from "@/lib/blog";

export function RecentBlogPosts() {
  const posts = getRecentPosts(3);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Latest Blog Posts</h3>
        <p className="text-sm text-gray-500">No blog posts yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Latest Blog Posts</h3>
        <Link
          href="/blog"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View all
        </Link>
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featuredImage}
              alt=""
              className="h-12 w-18 shrink-0 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600">
                {post.title}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                &middot; {post.readingTime}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
