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
import { Badge } from "@/components/ui/badge";

export default async function AdminPlansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const plans = await prisma.plans.findMany({ orderBy: { id: "asc" } });

  // Get subscriber counts
  const subscriberCounts = await prisma.members.groupBy({
    by: ["plan_id"],
    _count: { id: true },
  });
  const countMap = new Map(
    subscriberCounts.map((s) => [s.plan_id, s._count.id])
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plans</h1>
          <p className="text-muted-foreground">
            Manage subscription plans
          </p>
        </div>
        <Link href="/admin/plans/new">
          <Button>Create Plan</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-mono text-xs">
                    {plan.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {plan.name || "Unnamed"}
                  </TableCell>
                  <TableCell>
                    {plan.price ? `$${plan.price.toFixed(2)}` : "Free"}
                  </TableCell>
                  <TableCell>
                    {plan.campaigns_participants?.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell>{plan.no_of_domains || 0}</TableCell>
                  <TableCell>
                    {plan.days ? `${plan.days} days` : "Unlimited"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {countMap.get(plan.id) || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/plans/${plan.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No plans configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
