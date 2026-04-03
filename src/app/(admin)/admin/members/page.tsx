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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function AdminMembersPage({
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
          { email: { contains: search } },
          { name: { contains: search } },
        ],
      }
    : {};

  const [members, total, plans] = await Promise.all([
    prisma.members.findMany({
      where,
      orderBy: { date_signedup: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.members.count({ where }),
    prisma.plans.findMany(),
  ]);

  const planMap = new Map(plans.map((p) => [p.id, p.name]));
  const totalPages = Math.ceil(total / limit);

  // Get brand counts for displayed members
  const memberIds = members.map((m) => m.id);
  const brandCounts = await prisma.member_urls.groupBy({
    by: ["member_id"],
    where: { member_id: { in: memberIds } },
    _count: { id: true },
  });
  const brandCountMap = new Map(
    brandCounts.map((b) => [b.member_id, b._count.id])
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            {total.toLocaleString()} total members
          </p>
        </div>
        <Link href="/admin/members/new">
          <Button>Add Member</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Search Members</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input
              name="search"
              placeholder="Search by email or name..."
              defaultValue={search || ""}
              className="max-w-sm"
            />
            <Button type="submit">Search</Button>
            {search && (
              <Link href="/admin/members">
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Brands</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-mono text-xs">
                    {member.id}
                  </TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {planMap.get(member.plan_id ?? 0) || "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell>{brandCountMap.get(member.id) || 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.date_signedup
                      ? new Date(member.date_signedup).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {member.is_verified ? (
                      <Badge className="bg-green-100 text-green-800">Yes</Badge>
                    ) : (
                      <Badge variant="destructive">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/members/${member.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No members found.
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
              href={`/admin/members?page=${page - 1}${search ? `&search=${search}` : ""}`}
            >
              <Button variant="outline" size="sm">
                Previous
              </Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/members?page=${page + 1}${search ? `&search=${search}` : ""}`}
            >
              <Button variant="outline" size="sm">
                Next
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
