import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteUrl } from "@/lib/site-url";
import {
  listForumCategories,
  listForumTopics,
  parseForumTab,
} from "@/lib/forum";
import { ForumTopicList, forumHref } from "@/components/forum/topic-list";

export const metadata: Metadata = {
  title: "Community Forum",
  description:
    "Discuss referral marketing, ask questions, and share what is working with other Referrals.com members.",
  alternates: { canonical: siteUrl("/forum") },
};

const TABS = [
  { id: "latest", label: "Latest activity" },
  { id: "top", label: "Top" },
  { id: "unanswered", label: "Unanswered" },
  { id: "following", label: "Following" },
] as const;

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string; page?: string }>;
}) {
  const session = await auth();
  const memberId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  const params = await searchParams;
  const tab = parseForumTab(params.tab);
  const categorySlug = params.category || null;
  const page = parseInt(params.page || "1", 10);

  const [list, categories] = await Promise.all([
    listForumTopics({
      tab,
      categorySlug,
      page: Number.isFinite(page) ? page : 1,
      memberId,
    }),
    listForumCategories(),
  ]);

  const emptyMessage =
    tab === "following" && !memberId
      ? "Sign in to see topics you follow."
      : tab === "following"
        ? "You are not following any topics yet."
        : tab === "unanswered"
          ? "All topics have a reply."
          : "No topics yet. Be the first to start a discussion!";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forum</h1>
          <p className="mt-1 text-muted-foreground">
            Discuss referral marketing, ask questions, and share insights.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form action="/forum/search" className="flex gap-2">
            <Input
              name="q"
              placeholder="Search topics"
              className="min-h-11 w-full sm:w-56"
            />
            <Button type="submit" variant="outline" size="sm" className="min-h-11">
              Search
            </Button>
          </form>
          <Link href="/forum/new">
            <Button size="sm" className="min-h-11 w-full sm:w-auto">
              New Topic
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <Link
                key={item.id}
                href={forumHref({ tab: item.id, category: categorySlug })}
                className={`min-h-11 rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-gray-900 text-white"
                    : "bg-muted text-muted-foreground hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <form className="flex min-h-11 items-center gap-2">
          {tab !== "latest" ? (
            <input type="hidden" name="tab" value={tab} />
          ) : null}
          <label htmlFor="category" className="text-sm text-muted-foreground">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categorySlug || ""}
            className="min-h-11 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug || ""}>
                {category.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm" className="min-h-11">
            Filter
          </Button>
        </form>
      </div>

      <ForumTopicList
        topics={list.topics}
        categories={categories}
        emptyMessage={emptyMessage}
      />

      {list.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {list.page > 1 ? (
            <Link
              href={forumHref({
                tab,
                category: categorySlug,
                page: list.page - 1,
              })}
            >
              <Button variant="outline" size="sm">
                Previous
              </Button>
            </Link>
          ) : null}
          <span className="text-sm text-muted-foreground">
            Page {list.page} of {list.totalPages}
          </span>
          {list.page < list.totalPages ? (
            <Link
              href={forumHref({
                tab,
                category: categorySlug,
                page: list.page + 1,
              })}
            >
              <Button variant="outline" size="sm">
                Next
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Older threads from 2019–2021 have moved to the{" "}
        <Link href="/forum/archive" className="text-blue-600 hover:underline">
          Archive
        </Link>
        .
      </p>
    </div>
  );
}
