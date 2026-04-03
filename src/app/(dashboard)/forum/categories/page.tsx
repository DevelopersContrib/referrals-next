import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function ForumCategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const categories = await prisma.topic_categories.findMany({
    orderBy: { name: "asc" },
  });

  // Get topic counts per category
  const topicCounts = await prisma.topics.groupBy({
    by: ["category_id"],
    _count: { id: true },
  });
  const countMap = new Map(
    topicCounts.map((t) => [t.category_id, t._count.id])
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/forum" className="hover:text-gray-900">
            Forum
          </Link>
          <span>/</span>
          <span>Categories</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Forum Categories</h1>
        <p className="mt-1 text-muted-foreground">
          Browse topics by category.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-12">
            No categories yet.
          </p>
        ) : (
          categories.map((category) => (
            <Link key={category.id} href={`/forum/${category.slug || category.id}`}>
              <Card className="hover:border-blue-300 transition-colors h-full">
                <CardContent className="py-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {countMap.get(category.id) || 0} topics
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
