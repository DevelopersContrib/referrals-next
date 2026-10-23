import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import {
  listForumCategories,
  listForumTopics,
  listTopicAuthors,
} from "@/lib/forum";
import { ForumTopicList, forumHref } from "@/components/forum/topic-list";
import { ForumEmptyState } from "@/components/forum/empty-state";

export const metadata: Metadata = {
  title: "Search Forum",
  description: "Search Referrals.com forum topics by title, body, and replies.",
  alternates: { canonical: siteUrl("/forum/search") },
};

export default async function ForumSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  const memberId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  const params = await searchParams;
  const q = (params.q || "").trim();
  const page = parseInt(params.page || "1", 10);

  const [list, categories] = await Promise.all([
    q
      ? listForumTopics({
          query: q,
          page: Number.isFinite(page) ? page : 1,
          memberId,
        })
      : Promise.resolve({
          topics: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 1,
          categoryId: null,
          fetchedAt: 0,
        }),
    listForumCategories(),
  ]);

  const authors = await listTopicAuthors(list.topics);

  return (
    // The topic rows size themselves with container queries, so they need a
    // container to measure even where there is no sidebar beside them.
    <div className="@container space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/forum" className="hover:text-gray-900">
            Forum
          </Link>
          <span>/</span>
          <span>Search</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Search the forum</h1>
      </div>

      <form action="/forum/search" className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search topics and replies"
          className="min-h-11"
        />
        <Button type="submit" className="min-h-11">
          Search
        </Button>
      </form>

      {/* The count is dropped on a miss: the empty state below already says
          nothing matched, and saying it twice reads like a stutter. */}
      {q && list.total > 0 ? (
        <p className="text-sm text-muted-foreground">
          {list.total} result{list.total === 1 ? "" : "s"} for “{q}”
        </p>
      ) : !q ? (
        <p className="text-sm text-muted-foreground">
          Search topic titles, bodies, and replies.
        </p>
      ) : null}

      {/* Before anything is typed there is nothing to report, so the list is
          left off entirely rather than shown as an empty card. */}
      {q ? (
        <ForumTopicList
          topics={list.topics}
          categories={categories}
          authors={authors}
          now={list.fetchedAt}
          empty={
            <ForumEmptyState
              title={`No topics match “${q}”`}
              description="Try a shorter or different word. Search covers topic titles, bodies and replies."
              action={{ href: "/forum", label: "Browse the forum" }}
              secondaryAction={{ href: "/forum/new", label: "Ask a question" }}
            />
          }
        />
      ) : null}

      {q && list.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {list.page > 1 ? (
            <Link
              href={forumHref({
                q,
                page: list.page - 1,
                path: "/forum/search",
              })}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-muted-foreground">
            Page {list.page} of {list.totalPages}
          </span>
          {list.page < list.totalPages ? (
            <Link
              href={forumHref({
                q,
                page: list.page + 1,
                path: "/forum/search",
              })}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
