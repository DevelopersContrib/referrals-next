import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function PartnershipsToolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Partnerships</h1>
        <p className="mt-1 text-muted-foreground">
          Discover and manage partnerships to amplify your referral programs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Find Partners</CardTitle>
            <CardDescription>
              Browse other brands on Referrals.com and propose cross-promotion
              partnerships.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="py-4 text-center text-sm text-muted-foreground">
              Partner discovery coming soon. Check back for updates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Partnerships</CardTitle>
            <CardDescription>
              View and manage your current partnerships and collaboration
              campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="py-4 text-center text-sm text-muted-foreground">
              No active partnerships. Start by finding potential partners.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Partnerships Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <h3 className="font-medium text-gray-900">1. Connect</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Find brands that complement yours and send a partnership request.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">2. Collaborate</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up cross-promotion campaigns that benefit both audiences.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">3. Grow Together</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Track shared referrals and measure the impact of your
                partnership.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
