import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
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

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const [deals, total] = await Promise.all([
    prisma.brand_deals.findMany({
      orderBy: { date_created: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.brand_deals.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Get member info
  const memberIds = [...new Set(deals.map((d) => d.member_id))];
  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Deals</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} total deals
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Brand ID</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-mono text-xs">{deal.id}</TableCell>
                  <TableCell className="max-w-48 truncate font-medium">
                    {deal.title}
                  </TableCell>
                  <TableCell>
                    {deal.price ? (
                      <Badge variant="secondary">${deal.price}</Badge>
                    ) : (
                      "Free"
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/brands/${deal.url_id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      #{deal.url_id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {memberMap.get(deal.member_id) || `#${deal.member_id}`}
                  </TableCell>
                  <TableCell className="text-sm">
                    {deal.date_end || "No end date"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {deal.date_created
                      ? new Date(deal.date_created).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
              {deals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No deals found.
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
            <Link href={`/admin/deals?page=${page - 1}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/deals?page=${page + 1}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
