import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdsToolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ads</h1>
        <p className="mt-1 text-muted-foreground">
          Create and manage advertising campaigns to drive traffic to your
          referral programs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Active Ads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Impressions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Clicks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Ad Campaigns</CardTitle>
          <CardDescription>
            Create ad campaigns to promote your referral program across the
            Referrals.com network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-muted-foreground">
            No ad campaigns yet. Ad creation will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
