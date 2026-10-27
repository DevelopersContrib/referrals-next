import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import {
  listForumCategories,
  listForumTopics,
  listTopicAuthors,
  parseForumTab,
} from "@/lib/forum";
import { PinnedTopics } from "@/components/forum/pinned-topics";
import { ForumTopicList, forumHref } from "@/components/forum/topic-list";
import { ForumEmptyState } from "@/components/forum/empty-state";
import { ForumSidebar } from "@/components/forum/forum-sidebar";
import { SidebarDisclosure } from "@/components/forum/sidebar-disclosure";

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

function CategoryChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-border bg-background text-muted-foreground hover:text-gray-900"
      }`}
    >
      {label}
    </Link>
  );
}

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

  const authors = await listTopicAuthors(list.topics);

  // Pinned threads lead the list already, so lifting them into their own row
  // would show them twice. They are pulled out here, and only where the reader
  // has not narrowed things down with a tab, a category or a later page.
  const showPinned = tab === "latest" && !categorySlug && list.page === 1;
  const pinnedTopics = showPinned
    ? list.topics.filter((t) => t.is_pinned).slice(0, 2)
    : [];
  const pinnedIds = new Set(pinnedTopics.map((t) => t.id));
  const rowTopics = list.topics.filter((t) => !pinnedIds.has(t.id));

  const viewer = memberId
    ? await prisma.members.findUnique({
        where: { id: memberId },
        select: { forum_digest: true },
      })
    : null;

  // Archived categories are reachable through the Archive link under the list,
  // so the sidebar lists the ones a member can actually post in.
  const sidebarCategories = categories.filter((c) => !c.is_archived);
  const campaignCategory = sidebarCategories.find(
    (c) => c.slug === "show-your-campaign" || c.name === "Show your campaign",
  );

  // Each empty list has a different cause, so each gets its own way out. The
  // category cases name the category: "no topics yet" beside an active filter
  // reads as a broken forum rather than a narrow filter.
  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;
  const categoryLabel = activeCategory?.name ?? "this category";

  const empty =
    tab === "following" && !memberId ? (
      <ForumEmptyState
        title="Sign in to see topics you follow"
        description="Following a topic emails you whenever someone replies to it."
        action={{ href: "/signin?callbackUrl=/forum", label: "Sign in" }}
        secondaryAction={{ href: "/signup", label: "Create an account" }}
      />
    ) : tab === "following" ? (
      <ForumEmptyState
        title="You are not following any topics yet"
        description="Open a topic and choose Follow, and we will email you when someone replies."
        action={{ href: "/forum", label: "Browse latest topics" }}
      />
    ) : tab === "unanswered" ? (
      <ForumEmptyState
        title={
          activeCategory
            ? `Every question in ${categoryLabel} has an answer`
            : "Every question has an answer"
        }
        description="Nothing is waiting on a reply right now. Ask something new, or see what the community is discussing."
        action={{ href: "/forum/new", label: "Ask a question" }}
        secondaryAction={{ href: "/forum", label: "Browse latest topics" }}
      />
    ) : activeCategory ? (
      <ForumEmptyState
        title={`No topics in ${categoryLabel} yet`}
        description="Be the first to post here, or look through the other categories."
        action={{ href: "/forum/new", label: "Ask a question" }}
        secondaryAction={{ href: "/forum", label: "All categories" }}
      />
    ) : (
      <ForumEmptyState
        title="No topics yet"
        description="Be the first to start a discussion. The team reads every thread."
        action={{ href: "/forum/new", label: "Ask a question" }}
      />
    );

  const listHeader = (
    // Tabs and categories sit on their own rows. Side by side the chips
    // crowded the tabs badly enough to break them onto three lines at 1440px.
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Link
              key={item.id}
              href={forumHref({ tab: item.id, category: categorySlug })}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-md px-3 text-sm ${
                active
                  ? "bg-gray-900 text-white"
                  : // gray-700 rather than muted-foreground: grey-on-grey left
                    // the inactive tabs at 4.35:1, just under AA.
                    "bg-muted text-gray-700 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* Chips rather than a select: a long category name made the select and
          its Filter button overflow a 390px screen, where the page cannot
          scroll sideways, so the button could not be reached at all. */}
      <nav
        aria-label="Categories"
        className="flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] @xl:flex-wrap @xl:overflow-visible @xl:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        <CategoryChip
          href={forumHref({ tab })}
          active={!categorySlug}
          label="All categories"
        />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            href={forumHref({ tab, category: category.slug })}
            active={categorySlug === category.slug}
            label={category.name || "Untitled"}
          />
        ))}
      </nav>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="@container rounded-xl bg-card px-4 py-6 ring-1 ring-foreground/10 sm:px-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center hover:text-gray-900"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-gray-900">
              Community
            </li>
          </ol>
        </nav>

        <div className="mt-3 flex flex-col gap-4 @2xl:flex-row @2xl:items-end @2xl:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              Referrals.com Community
            </h1>
            <p className="mt-1 text-muted-foreground">
              Ask questions, share what is working, and get answers from the
              team and other members.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/forum/activity"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "min-h-11",
              )}
            >
              Activity
            </Link>
            <Link
              href="/forum/new"
              className={cn(buttonVariants({ size: "sm" }), "min-h-11 px-5")}
            >
              New topic
            </Link>
          </div>
        </div>

        <form
          action="/forum/search"
          className="mt-4 flex flex-col gap-2 sm:flex-row"
        >
          <Input
            name="q"
            placeholder="Search topics"
            aria-label="Search topics"
            className="min-h-11 sm:max-w-md"
          />
          <Button type="submit" variant="outline" className="min-h-11 px-5">
            Search
          </Button>
        </form>
      </section>

      <div className="grid items-start gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_320px]">
        {/* Container queries, not viewport ones: beside the sidebar this column
            is far narrower than the window, and the header and tab rows were
            going side-by-side at widths where they did not fit. */}
        <div className="@container min-w-0 space-y-6">
          <PinnedTopics topics={pinnedTopics} categories={categories} />

          <ForumTopicList
            topics={rowTopics}
            categories={categories}
            authors={authors}
            header={listHeader}
            empty={empty}
            now={list.fetchedAt}
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
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "min-h-11 px-4",
                  )}
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
                    tab,
                    category: categorySlug,
                    page: list.page + 1,
                  })}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "min-h-11 px-4",
                  )}
                >
                  Next
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-xl bg-muted/50 px-4 py-4 @xl:flex-row @xl:items-center @xl:justify-between @xl:px-6">
            <p className="text-sm text-muted-foreground">
              Older threads from 2019–2021 have moved to the Archive.
            </p>
            <Link
              href="/forum/archive"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "min-h-11 shrink-0 px-4",
              )}
            >
              Browse archive
            </Link>
          </div>
        </div>

        <aside>
          <SidebarDisclosure>
            <ForumSidebar
              categories={sidebarCategories}
              activeSlug={categorySlug}
              hrefFor={(slug) => forumHref({ tab, category: slug })}
              showCampaignHref={
                campaignCategory
                  ? `/forum/new?category=${campaignCategory.id}`
                  : null
              }
              digest={{
                signedIn: Boolean(memberId),
                enabled: Boolean(viewer?.forum_digest),
              }}
            />
          </SidebarDisclosure>
        </aside>
      </div>
    </div>
  );
}
