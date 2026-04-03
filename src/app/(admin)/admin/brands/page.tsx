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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam, search } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const where = search
    ? {
        OR: [
          { url: { contains: search } },
          { domain: { contains: search } },
        ],
      }
    : {};

  const [brands, total] = await Promise.all([
    prisma.member_urls.findMany({
      where,
      orderBy: { date_added: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member_urls.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Get member info for each brand
  const memberIds = [...new Set(brands.map((b) => b.member_id))];
  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, email: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Get campaign count per brand
  const brandIds = brands.map((b) => b.id);
  const campaignCounts = await prisma.member_campaigns.groupBy({
    by: ["url_id"],
    where: { url_id: { in: brandIds } },
    _count: { id: true },
  });
  const campaignCountMap = new Map(
    campaignCounts.map((c) => [c.url_id, c._count.id])
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Brands</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} total brands
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Search Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input
              name="search"
              placeholder="Search by URL or domain..."
              defaultValue={search || ""}
              className="max-w-sm"
            />
            <Button type="submit">Search</Button>
            {search && (
              <Link href="/admin/brands">
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
                <TableHead>Domain</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Campaigns</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => {
                const owner = memberMap.get(brand.member_id);
                return (
                  <TableRow key={brand.id}>
                    <TableCell className="font-mono text-xs">
                      {brand.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {brand.domain}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm">
                      {brand.url}
                    </TableCell>
                    <TableCell>
                      {owner ? (
                        <Link
                          href={`/admin/members/${owner.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          {owner.name}
                        </Link>
                      ) : (
                        <Badge variant="destructive">Unknown</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaignCountMap.get(brand.id) || 0}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {brand.date_added
                        ? new Date(brand.date_added).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/brands/${brand.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No brands found.
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
              href={`/admin/brands?page=${page - 1}${search ? `&search=${search}` : ""}`}
            >
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/brands?page=${page + 1}${search ? `&search=${search}` : ""}`}
            >
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
