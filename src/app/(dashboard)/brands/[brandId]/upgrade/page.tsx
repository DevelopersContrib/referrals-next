import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function UpgradeBrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId } = await params;
  const brand = await prisma.member_urls.findUnique({
    where: { id: parseInt(brandId, 10) },
  });
  if (!brand || brand.member_id !== parseInt(session.user.id, 10)) redirect("/brands");

  const plans = await prisma.plans.findMany({ orderBy: { price: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upgrade — {brand.domain}</h1>
        <p className="text-muted-foreground">Choose a plan to unlock more features for this brand.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>${Number(plan.price || 0).toFixed(2)}/month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Up to {plan.no_of_domains || "unlimited"} brands, {plan.campaigns_participants || "unlimited"} participants</p>
              <Link
                href={`/billing/plan/${plan.id}`}
                className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Select Plan
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
