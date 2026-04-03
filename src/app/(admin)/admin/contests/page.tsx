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

export default async function AdminContestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const [contests, total] = await Promise.all([
    prisma.campaign_contest.findMany({
      orderBy: { date_added: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign_contest.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Contests</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} total contests across all campaigns
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Contest Name</TableHead>
                <TableHead>Campaign ID</TableHead>
                <TableHead>Type ID</TableHead>
                <TableHead>Max Winners</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contests.map((contest) => (
                <TableRow key={contest.id}>
                  <TableCell className="font-mono text-xs">
                    {contest.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {contest.contest_name}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/campaigns/${contest.campaign_id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      #{contest.campaign_id}
                    </Link>
                  </TableCell>
                  <TableCell>{contest.contest_type_id}</TableCell>
                  <TableCell>{contest.max_winners || 1}</TableCell>
                  <TableCell>
                    {contest.is_on ? (
                      <Badge className="bg-green-100 text-green-800">On</Badge>
                    ) : (
                      <Badge variant="secondary">Off</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {contest.start_date || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {contest.end_date || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(contest.date_added).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {contests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No contests found.
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
            <Link href={`/admin/contests?page=${page - 1}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/contests?page=${page + 1}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
