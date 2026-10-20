import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { ForumTopicListItem } from "@/lib/forum";
import type { topic_categories } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

/**
 * The two threads the team wants every visitor to read, above the list. Shown
 * only on the unfiltered first page, where they are not competing with a tab
 * or category the reader chose themselves.
 */
export function PinnedTopics({
  topics,
  categories,
}: {
  topics: ForumTopicListItem[];
  categories: Pick<topic_categories, "id" | "name" | "slug">[];
}) {
  if (topics.length === 0) return null;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <section aria-labelledby="pinned-heading">
      <h2
        id="pinned-heading"
        className="font-heading mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase"
      >
        Pinned by the team
      </h2>
      <div className="grid gap-4 @xl:grid-cols-2">
        {topics.map((topic) => {
          const category = topic.category_id
            ? categoryMap.get(topic.category_id)
            : null;
          return (
            <Card key={topic.id} className="border-l-4 border-l-[#ff5c62]">
              <CardContent className="space-y-2">
                <CardTitle as="h3">
                  <Link
                    href={`/forum/post/${topic.slug || topic.id}`}
                    className="flex min-h-11 items-center text-gray-900 hover:text-blue-600"
                  >
                    {topic.title}
                  </Link>
                </CardTitle>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {topic.content.replace(/\s+/g, " ").trim()}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {category ? (
                    <Badge variant="secondary" className="text-xs">
                      {category.name}
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {topic.replyCount}{" "}
                    {topic.replyCount === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
