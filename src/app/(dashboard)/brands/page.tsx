import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function BrandsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);

  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your brands and their referral campaigns.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/brands/export">
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
          </a>
          <Link href="/brands/new">
            <Button>Add Brand</Button>
          </Link>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Brands ({brands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                You haven&apos;t added any brands yet.
              </p>
              <Link href="/brands/new" className="mt-4 inline-block">
                <Button>Add Your First Brand</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">
                      {brand.domain}
                    </TableCell>
                    <TableCell>
                      <a
                        href={brand.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {brand.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      {new Date(brand.date_added).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {brand.plan_expiry &&
                      new Date(brand.plan_expiry) > new Date() ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/brands/${brand.id}`}>
                          <Button variant="outline" size="sm">
                            Dashboard
                          </Button>
                        </Link>
                        <Link href={`/brands/${brand.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
