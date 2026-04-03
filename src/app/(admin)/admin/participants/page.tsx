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

export default async function AdminParticipantsPage({
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

  const [participants, total] = await Promise.all([
    prisma.campaign_participants.findMany({
      where,
      orderBy: { date_signedup: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign_participants.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Participants</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} total participants across all campaigns
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Search Participants</CardTitle>
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
              <Link href="/admin/participants">
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
                <TableHead>Campaign ID</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Signed Up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/campaigns/${p.campaign_id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      #{p.campaign_id}
                    </Link>
                  </TableCell>
                  <TableCell>{p.invited_by || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {p.ip_address || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.date_signedup).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {participants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No participants found.
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
              href={`/admin/participants?page=${page - 1}${search ? `&search=${search}` : ""}`}
            >
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/participants?page=${page + 1}${search ? `&search=${search}` : ""}`}
            >
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
