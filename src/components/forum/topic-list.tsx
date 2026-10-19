import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ForumTopicListItem } from "@/lib/forum";
import type { topic_categories } from "@prisma/client";

export function ForumTopicList({
  topics,
  categories,
  emptyMessage,
}: {
  topics: ForumTopicListItem[];
  categories: Pick<topic_categories, "id" | "name" | "slug">[];
  emptyMessage: string;
}) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  if (topics.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => {
        const category = topic.category_id
          ? categoryMap.get(topic.category_id)
          : null;
        return (
          <Card key={topic.id}>
            <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:gap-4">
              <div className="flex gap-6 lg:gap-4">
                <div className="flex min-w-[60px] flex-col items-center gap-1 text-center">
                  <span className="text-lg font-bold">{topic.voteCount}</span>
                  <span className="text-xs text-muted-foreground">votes</span>
                </div>
                <div className="flex min-w-[60px] flex-col items-center gap-1 text-center">
                  <span className="text-lg font-bold">{topic.replyCount}</span>
                  <span className="text-xs text-muted-foreground">replies</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/forum/post/${topic.slug || topic.id}`}
                  className="wrap-break-word block font-medium text-gray-900 hover:text-blue-600"
                >
                  {topic.title}
                </Link>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {topic.content.replace(/\s+/g, " ").trim()}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {topic.is_pinned ? (
                    <Badge className="text-xs">Pinned</Badge>
                  ) : null}
                  {topic.status === "answered" ? (
                    <Badge variant="secondary" className="text-xs">
                      Answered
                    </Badge>
                  ) : null}
                  {category ? (
                    <Link href={`/forum/${category.slug || category.id}`}>
                      <Badge variant="secondary" className="text-xs">
                        {category.name}
                      </Badge>
                    </Link>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {new Date(topic.last_activity_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
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
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  const path = options.path || "/forum";
  return query ? `${path}?${query}` : path;
}
