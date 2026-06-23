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
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { AdminPagination } from "@/components/admin/admin-pagination";

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; campaign?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam, campaign } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (campaign) {
    where.campaign_id = parseInt(campaign, 10);
  }

  const [coupons, total] = await Promise.all([
    prisma.campaign_coupons.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign_coupons.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">
            {total.toLocaleString()} total coupons across all campaigns
          </p>
        </div>
        <Link href="/admin/coupons/new">
          <Button>New Coupon</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter by Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input
              name="campaign"
              placeholder="Campaign ID"
              defaultValue={campaign || ""}
              className="max-w-48"
              type="number"
            />
            <Button type="submit">Filter</Button>
            {campaign && (
              <Link href="/admin/coupons">
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
                <TableHead>Code</TableHead>
                <TableHead>Campaign ID</TableHead>
                <TableHead>Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono text-xs">
                    {coupon.id}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {coupon.code || "-"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/campaigns/${coupon.campaign_id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      #{coupon.campaign_id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {coupon.is_used ? (
                      <Badge variant="destructive">Used</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        Available
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/coupons/${coupon.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <AdminDeleteButton endpoint={`/api/admin/coupons/${coupon.id}`} label="coupon" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No coupons found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/coupons"
        params={{ campaign }}
      />
    </div>
  );
}
