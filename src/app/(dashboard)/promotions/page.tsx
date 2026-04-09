import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PromoteForm } from "./promote-form";

export default async function PromotionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);

  // Get campaigns for this member
  const campaigns = await prisma.member_campaigns.findMany({
    where: { member_id: memberId },
    select: { id: true, name: true },
  });
  const campaignIds = campaigns.map((c) => c.id);
  const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

  // Get existing promotions
  const promotions = campaignIds.length > 0
    ? await prisma.campaign_promote.findMany({
        where: { campaign_id: { in: campaignIds } },
        orderBy: { date_updated: "desc" },
      })
    : [];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Promotions</h1>
        <p className="mt-1 text-muted-foreground">
          Promote your campaigns to reach a wider audience and gain more
          participants.
        </p>
      </div>

      {/* Create Promotion */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Submit Campaign for Promotion</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground">
              You need at least one campaign to create a promotion. Create a
              campaign first.
            </p>
          ) : (
            <PromoteForm
              campaigns={campaigns.map((c) => ({
                id: c.id.toString(),
                name: c.name,
              }))}
            />
          )}
        </CardContent>
      </Card>

      {/* Promotions List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your Promotions ({promotions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No promotions yet. Submit a campaign above to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Sent</TableHead>
                  <TableHead>Date Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">
                      {campaignMap.get(promo.campaign_id) ||
                        `Campaign #${promo.campaign_id}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={promo.approved ? "default" : "secondary"}
                      >
                        {promo.approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.sent_email ? "default" : "outline"}>
                        {promo.sent_email ? "Sent" : "Not Sent"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(promo.date_updated).toLocaleDateString()}
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
