import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

interface CampaignListPageProps {
  params: Promise<{ brandId: string }>;
}

export default async function CampaignListPage({
  params,
}: CampaignListPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const urlId = parseInt(brandId, 10);

  // Verify brand ownership
  const brand = await prisma.member_urls.findFirst({
    where: { id: urlId, member_id: memberId },
  });

  if (!brand) redirect("/dashboard");

  // Fetch campaigns
  const campaigns = await prisma.member_campaigns.findMany({
    where: { url_id: urlId, member_id: memberId },
    orderBy: { date_added: "desc" },
  });

  // Get participant counts
  const campaignIds = campaigns.map((c) => c.id);
  const participantCounts =
    campaignIds.length > 0
      ? await prisma.campaign_participants.groupBy({
          by: ["campaign_id"],
          where: { campaign_id: { in: campaignIds } },
          _count: { id: true },
        })
      : [];
  const countMap = new Map(
    participantCounts.map((p) => [p.campaign_id, p._count.id])
  );

  // Get campaign types
  const typeIds = [...new Set(campaigns.map((c) => c.type_id))];
  const types =
    typeIds.length > 0
      ? await prisma.campaign_types.findMany({
          where: { id: { in: typeIds } },
        })
      : [];
  const typeMap = new Map(types.map((t) => [t.id, t.name]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="mt-1 text-muted-foreground">
            Manage referral campaigns for {brand.url || "your brand"}
          </p>
        </div>
        <Link href={`/brands/${brandId}/campaigns/new`}>
          <Button>Create Campaign</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="text-lg font-semibold">No campaigns yet</h3>
              <p className="mt-1 text-muted-foreground">
                Create your first referral campaign to get started
              </p>
              <Link href={`/brands/${brandId}/campaigns/new`}>
                <Button className="mt-4">Create Campaign</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Participants</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link
                        href={`/brands/${brandId}/campaigns/${campaign.id}`}
                        className="font-medium hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {typeMap.get(campaign.type_id) || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.publish === "public"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {campaign.publish || "public"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(countMap.get(campaign.id) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {campaign.date_added.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/brands/${brandId}/campaigns/${campaign.id}`}
                        >
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link
                          href={`/brands/${brandId}/campaigns/${campaign.id}/edit`}
                        >
                          <Button variant="outline" size="sm">
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
