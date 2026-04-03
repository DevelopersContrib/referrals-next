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
import { Separator } from "@/components/ui/separator";
import { RewardsCouponForm } from "./coupon-form";

interface RewardsPageProps {
  params: Promise<{ brandId: string; campaignId: string }>;
}

export default async function RewardsPage({ params }: RewardsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId, campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);

  const campaign = await prisma.member_campaigns.findFirst({
    where: { id, member_id: memberId },
  });
  if (!campaign) redirect(`/brands/${brandId}/campaigns`);

  const [reward, coupons, rewardType] = await Promise.all([
    prisma.campaign_reward.findFirst({ where: { campaign_id: id } }),
    prisma.campaign_coupons.findMany({
      where: { campaign_id: id },
      orderBy: { id: "desc" },
    }),
    prisma.reward_types.findFirst({ where: { id: campaign.reward_type } }),
  ]);

  const usedCount = coupons.filter((c) => c.is_used).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards & Coupons</h1>
          <p className="mt-1 text-muted-foreground">{campaign.name}</p>
        </div>
        <Link href={`/brands/${brandId}/campaigns/${campaignId}`}>
          <Button variant="outline">Back to Campaign</Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Reward Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Reward Configuration</CardTitle>
            <CardDescription>
              Current reward settings for this campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Reward Type</p>
              <p className="font-medium">{rewardType?.name || "Not set"}</p>
            </div>

            {reward?.redirect_url && (
              <div>
                <p className="text-sm text-muted-foreground">Redirect URL</p>
                <p className="font-medium break-all">{reward.redirect_url}</p>
              </div>
            )}

            {reward?.custom_message && (
              <div>
                <p className="text-sm text-muted-foreground">Custom Message</p>
                <p className="text-sm">{reward.custom_message}</p>
              </div>
            )}

            {reward?.cash_value && reward.cash_value > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Cash Value</p>
                <p className="font-medium">${reward.cash_value.toFixed(2)}</p>
              </div>
            )}

            {reward?.token_symbol && (
              <div>
                <p className="text-sm text-muted-foreground">Token Reward</p>
                <p className="font-medium">
                  {reward.token_amount} {reward.token_symbol}
                </p>
              </div>
            )}

            {reward?.reward_email_subject && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Reward Email Subject
                  </p>
                  <p className="font-medium">{reward.reward_email_subject}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Coupons */}
        <RewardsCouponForm campaignId={campaignId} />
      </div>

      {/* Coupon List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            Coupons ({coupons.length} total, {usedCount} used)
          </CardTitle>
          <CardDescription>
            Coupon codes assigned to this campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No coupons added yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add coupon codes using the form above
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-medium">
                      {coupon.code || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={coupon.is_used ? "secondary" : "default"}
                      >
                        {coupon.is_used ? "Used" : "Available"}
                      </Badge>
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
