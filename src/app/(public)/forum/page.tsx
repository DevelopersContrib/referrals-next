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
  parseForumTab,
} from "@/lib/forum";
import { ForumTopicList, forumHref } from "@/components/forum/topic-list";
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

  const emptyMessage =
    tab === "following" && !memberId
      ? "Sign in to see topics you follow."
      : tab === "following"
        ? "You are not following any topics yet."
        : tab === "unanswered"
          ? "All topics have a reply."
          : "No topics yet. Be the first to start a discussion!";

  return (
    <div className="grid items-start gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_320px]">
      {/* Container queries, not viewport ones: beside the sidebar this column
          is far narrower than the window, and the header and tab rows were
          going side-by-side at widths where they did not fit. */}
      <div className="@container min-w-0 space-y-6">
      <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
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
            className={cn(
              buttonVariants({ size: "sm" }),
              "min-h-11 w-full sm:w-auto",
            )}
          >
            New Topic
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-center @2xl:justify-between">
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
        {/* Chips rather than a select: a long category name made the select and
            its Filter button overflow a 390px screen, where the page cannot
            scroll sideways, so the button could not be reached at all. */}
        <nav
          aria-label="Categories"
          className="flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] @2xl:flex-wrap @2xl:justify-end @2xl:overflow-visible @2xl:pb-0 [&::-webkit-scrollbar]:hidden"
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

      <p className="text-sm text-muted-foreground">
        Older threads from 2019–2021 have moved to the{" "}
        <Link href="/forum/archive" className="text-blue-600 hover:underline">
          Archive
        </Link>
        .
      </p>
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
  );
}
