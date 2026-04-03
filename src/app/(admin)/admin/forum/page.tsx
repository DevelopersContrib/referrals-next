import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function AdminForumPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam, search, category } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.title = { contains: search };
  }
  if (category) {
    where.category_id = parseInt(category, 10);
  }

  const [topics, total, categories] = await Promise.all([
    prisma.topics.findMany({
      where,
      orderBy: { date_posted: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.topics.count({ where }),
    prisma.topic_categories.findMany(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Get comment counts
  const topicIds = topics.map((t) => t.id);
  const commentCounts = await prisma.topic_comments.groupBy({
    by: ["topic_id"],
    where: { topic_id: { in: topicIds } },
    _count: { id: true },
  });
  const commentCountMap = new Map(
    commentCounts.map((c) => [c.topic_id, c._count.id])
  );

  // Get member info
  const memberIds = topics
    .map((t) => t.member_id)
    .filter((id): id is number => id != null);
  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Forum Moderation</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} total forum topics
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {cat.name || "Uncategorized"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/forum?category=${cat.id}`}
                className="text-blue-600 hover:underline"
              >
                View Topics
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Search Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input
              name="search"
              placeholder="Search by title..."
              defaultValue={search || ""}
              className="max-w-sm"
            />
            <Button type="submit">Search</Button>
            {(search || category) && (
              <Link href="/admin/forum">
                <Button variant="outline">Clear</Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Posted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-mono text-xs">
                    {topic.id}
                  </TableCell>
                  <TableCell className="max-w-64 truncate font-medium">
                    {topic.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categoryMap.get(topic.category_id ?? 0) || "None"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {topic.member_id
                      ? memberMap.get(topic.member_id) ||
                        `#${topic.member_id}`
                      : "Anonymous"}
                  </TableCell>
                  <TableCell>
                    {commentCountMap.get(topic.id) || 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(topic.date_posted).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {topics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No topics found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/forum?page=${page - 1}${search ? `&search=${search}` : ""}${category ? `&category=${category}` : ""}`}
            >
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/forum?page=${page + 1}${search ? `&search=${search}` : ""}${category ? `&category=${category}` : ""}`}
            >
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
