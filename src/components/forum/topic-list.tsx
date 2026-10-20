import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isAnnouncementsSlug, type ForumTopicListItem } from "@/lib/forum";
import type { topic_categories } from "@prisma/client";
import {
  NeedsAnswerBadge,
  TeamBadge,
  needsAnswer,
} from "@/components/forum/badges";

export type TopicAuthor = {
  id: number;
  name: string | null;
  is_team: boolean;
};

/** Up to two initials, so the avatar stays legible at 36px. */
function initialsOf(name: string | null) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function Avatar({ name }: { name: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-gray-700"
    >
      {initialsOf(name)}
    </span>
  );
}

function MetaColumn({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-20 flex-col items-center gap-0.5 text-center">
      <span className="text-sm font-semibold text-gray-900">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function ForumTopicList({
  topics,
  categories,
  authors = [],
  header,
  emptyMessage,
}: {
  topics: ForumTopicListItem[];
  categories: Pick<topic_categories, "id" | "name" | "slug">[];
  authors?: TopicAuthor[];
  /** Tabs and the category filter, which sit inside the same card as the rows. */
  header?: React.ReactNode;
  emptyMessage: string;
}) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  return (
    <Card className="gap-0 p-0">
      {header ? (
        <div className="border-b px-4 py-4 @xl:px-6">{header}</div>
      ) : null}

      {topics.length === 0 ? (
        <div className="px-4 py-12 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {topics.map((topic) => {
            const category = topic.category_id
              ? categoryMap.get(topic.category_id)
              : null;
            const author = topic.member_id
              ? authorMap.get(topic.member_id)
              : null;
            // Two different dates: when the thread was started, beside its
            // author, and when it last moved, in the Activity column.
            const posted = new Date(topic.date_posted).toLocaleDateString();
            const activity = new Date(
              topic.last_activity_at,
            ).toLocaleDateString();

            return (
              <div
                key={topic.id}
                className="flex gap-3 px-4 py-4 @xl:gap-4 @xl:px-6"
              >
                <Avatar name={author?.name ?? null} />

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/forum/post/${topic.slug || topic.id}`}
                    className="wrap-break-word flex min-h-11 items-center font-medium text-gray-900 hover:text-blue-600"
                  >
                    {topic.title}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {topic.content.replace(/\s+/g, " ").trim()}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {topic.is_pinned ? (
                      <Badge className="text-xs">Pinned</Badge>
                    ) : null}
                    {topic.status === "answered" ? (
                      <Badge variant="secondary" className="text-xs">
                        Answered
                      </Badge>
                    ) : null}
                    {needsAnswer({
                      ...topic,
                      isAnnouncement: isAnnouncementsSlug(category?.slug),
                    }) ? (
                      <NeedsAnswerBadge />
                    ) : null}
                    {category ? (
                      <Link
                        href={`/forum/${category.slug || category.id}`}
                        className="inline-flex min-h-11 max-w-full items-center"
                      >
                        <Badge
                          variant="secondary"
                          className="max-w-full truncate text-xs"
                        >
                          {category.name}
                        </Badge>
                      </Link>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {author?.name || "Unknown"}
                    </span>
                    {author?.is_team ? <TeamBadge /> : null}
                    <span className="text-xs text-muted-foreground">
                      {posted}
                    </span>
                  </div>

                  {/* Phones have no room for the right-hand columns, so the two
                    counts ride under the row instead. */}
                  <p className="mt-1 text-xs text-muted-foreground @xl:hidden">
                    {topic.replyCount}{" "}
                    {topic.replyCount === 1 ? "reply" : "replies"} &middot;
                    active {activity}
                  </p>
                </div>

                <div className="hidden shrink-0 items-center gap-2 @xl:flex">
                  <MetaColumn
                    label="Replies"
                    value={String(topic.replyCount)}
                  />
                  <MetaColumn label="Activity" value={activity} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function forumHref(options: {
  tab?: string;
  category?: string | null;
  page?: number;
  q?: string | null;
  path?: string;
}) {
  const params = new URLSearchParams();
  const tab = options.tab && options.tab !== "latest" ? options.tab : "";
  if (tab) params.set("tab", tab);
  if (options.category) params.set("category", options.category);
  if (options.q) params.set("q", options.q);
  if (options.page && options.page > 1)
    params.set("page", String(options.page));
  const query = params.toString();
  const path = options.path || "/forum";
  return query ? `${path}?${query}` : path;
}
