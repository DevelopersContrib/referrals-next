import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PromotionToolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const promotions = await prisma.campaign_promote.findMany({
    where: { member_id: memberId },
    orderBy: { date_updated: "desc" },
    take: 20,
  });

  // Get campaign names
  const campaignIds = promotions.map((p) => p.campaign_id);
  const campaigns =
    campaignIds.length > 0
      ? await prisma.member_campaigns.findMany({
          where: { id: { in: campaignIds } },
          select: { id: true, name: true },
        })
      : [];
  const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Promotion</h1>
        <p className="mt-1 text-muted-foreground">
          Promote your campaigns across the Referrals.com network for increased
          visibility.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Requests</CardTitle>
          <CardDescription>
            Submit campaigns for promotion on the Referrals.com marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No promotion requests yet. Submit your first campaign for
              promotion.
            </p>
          ) : (
            <div className="space-y-3">
              {promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {campaignMap.get(promo.campaign_id) ||
                        `Campaign #${promo.campaign_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted{" "}
                      {new Date(promo.date_updated).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={promo.approved ? "default" : "secondary"}>
                    {promo.approved ? "Approved" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
