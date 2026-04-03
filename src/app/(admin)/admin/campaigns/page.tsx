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

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam, search, type } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search };
  }
  if (type) {
    where.type_id = parseInt(type, 10);
  }

  const [campaigns, total, campaignTypes] = await Promise.all([
    prisma.member_campaigns.findMany({
      where,
      orderBy: { date_added: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member_campaigns.count({ where }),
    prisma.campaign_types.findMany(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const typeMap = new Map(campaignTypes.map((t) => [t.id, t.name]));

  // Get brand info
  const urlIds = [...new Set(campaigns.map((c) => c.url_id))];
  const brands = await prisma.member_urls.findMany({
    where: { id: { in: urlIds } },
    select: { id: true, domain: true },
  });
  const brandMap = new Map(brands.map((b) => [b.id, b.domain]));

  // Get participant counts
  const campaignIds = campaigns.map((c) => c.id);
  const participantCounts = await prisma.campaign_participants.groupBy({
    by: ["campaign_id"],
    where: { campaign_id: { in: campaignIds } },
    _count: { id: true },
  });
  const participantCountMap = new Map(
    participantCounts.map((p) => [p.campaign_id, p._count.id])
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} total campaigns
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-2">
            <Input
              name="search"
              placeholder="Search by campaign name..."
              defaultValue={search || ""}
              className="max-w-sm"
            />
            <select
              name="type"
              defaultValue={type || ""}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              {campaignTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
            <Button type="submit">Filter</Button>
            {(search || type) && (
              <Link href="/admin/campaigns">
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
                <TableHead>Type</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Publish</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-mono text-xs">
                    {campaign.id}
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-medium">
                    {campaign.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {typeMap.get(campaign.type_id) || `Type ${campaign.type_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {brandMap.get(campaign.url_id) || `Brand #${campaign.url_id}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        campaign.publish === "public" ? "default" : "secondary"
                      }
                    >
                      {campaign.publish || "public"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {participantCountMap.get(campaign.id) || 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(campaign.date_added).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No campaigns found.
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
              href={`/admin/campaigns?page=${page - 1}${search ? `&search=${search}` : ""}${type ? `&type=${type}` : ""}`}
            >
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/campaigns?page=${page + 1}${search ? `&search=${search}` : ""}${type ? `&type=${type}` : ""}`}
            >
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
