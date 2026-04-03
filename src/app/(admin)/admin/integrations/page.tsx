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

export default async function AdminIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const [integrations, total] = await Promise.all([
    prisma.member_mailchimp.findMany({
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member_mailchimp.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Get member names
  const memberIds = [...new Set(integrations.map((i) => i.member_id))];
  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, email: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} Mailchimp connections
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>API Key (masked)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => {
                const member = memberMap.get(integration.member_id);
                const maskedKey = integration.api_key
                  ? `${integration.api_key.substring(0, 6)}...${ integration.api_key.slice(-4)}`
                  : "-";
                return (
                  <TableRow key={integration.id}>
                    <TableCell className="font-mono text-xs">
                      {integration.id}
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
                        `#${integration.member_id}`
                      )}
                    </TableCell>
                    <TableCell>{member?.email || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {maskedKey}
                    </TableCell>
                  </TableRow>
                );
              })}
              {integrations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No integrations found.
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
            <Link href={`/admin/integrations?page=${page - 1}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/integrations?page=${page + 1}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
