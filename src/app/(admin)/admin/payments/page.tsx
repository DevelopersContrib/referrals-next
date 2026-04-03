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

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam, status } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const [payments, total, revenueAgg] = await Promise.all([
    prisma.member_payment.findMany({
      where,
      orderBy: { datetime_created: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member_payment.count({ where }),
    prisma.member_payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Get member info
  const memberIds = [...new Set(payments.map((p) => p.member_id))];
  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, email: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div>
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="text-muted-foreground">
        {total.toLocaleString()} total payments
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${(revenueAgg._sum.amount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {revenueAgg._count.id.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              $
              {revenueAgg._count.id > 0
                ? (
                    (revenueAgg._sum.amount || 0) / revenueAgg._count.id
                  ).toFixed(2)
                : "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input
              name="status"
              placeholder="Filter by status (e.g. completed)"
              defaultValue={status || ""}
              className="max-w-sm"
            />
            <Button type="submit">Filter</Button>
            {status && (
              <Link href="/admin/payments">
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
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const member = memberMap.get(payment.member_id);
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.id}
                    </TableCell>
                    <TableCell>
                      {member ? (
                        <Link
                          href={`/admin/members/${member.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          {member.name}
                        </Link>
                      ) : (
                        `Member #${payment.member_id}`
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.amount
                        ? `$${payment.amount.toFixed(2)} ${payment.currency || ""}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {payment.status || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-32 truncate text-sm">
                      {payment.description || "-"}
                    </TableCell>
                    <TableCell className="max-w-32 truncate font-mono text-xs">
                      {payment.transaction_id || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(payment.datetime_created).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No payments found.
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
              href={`/admin/payments?page=${page - 1}${status ? `&status=${status}` : ""}`}
            >
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/payments?page=${page + 1}${status ? `&status=${status}` : ""}`}
            >
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
