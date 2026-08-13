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
import { getExcludedMemberIds } from "@/lib/platform-admin";
import { getSubscribersByPlan } from "@/lib/revenue";

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default async function AdminPlansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const now = new Date();
  const [plans, excludedIds] = await Promise.all([
    prisma.plans.findMany({ orderBy: { id: "asc" } }),
    getExcludedMemberIds(),
  ]);
  const byPlan = await getSubscribersByPlan({ excludeMemberIds: excludedIds, now });

  const totalActive = [...byPlan.values()].reduce((a, s) => a + s.active, 0);
  const totalMrr = [...byPlan.values()].reduce((a, s) => a + s.mrr, 0);
  const payingPlans = plans.filter((p) => (p.price ?? 0) > 0).length;

  const summary = [
    { label: "Active subscribers", value: totalActive.toLocaleString() },
    { label: "MRR (est.)", value: money(totalMrr) },
    { label: "ARR (est.)", value: money(totalMrr * 12) },
    { label: "Paid plans", value: String(payingPlans) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plans</h1>
          <p className="text-muted-foreground">
            Manage subscription plans — subscriber counts exclude team &amp; test accounts.
          </p>
        </div>
        <Link href="/admin/plans/new">
          <Button>Create Plan</Button>
        </Link>
      </div>

      {/* Subscriber / revenue breakdown */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Subscribers per plan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Expired</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => {
                const stat = byPlan.get(plan.id);
                const active = stat?.active ?? 0;
                const expired = stat?.expired ?? 0;
                const mrr = stat?.mrr ?? 0;
                return (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                    <TableCell className="font-medium">
                      {plan.name || "Unnamed"}
                    </TableCell>
                    <TableCell>
                      {plan.price ? `$${plan.price.toFixed(2)}` : "Free"}
                    </TableCell>
                    <TableCell>
                      {plan.days ? `${plan.days} days` : "Unlimited"}
                    </TableCell>
                    <TableCell className="text-right">
                      {active > 0 ? (
                        <Link href={`/admin/plans/${plan.id}/subscribers`}>
                          <Badge variant="secondary" className="tabular-nums hover:bg-muted">
                            {active.toLocaleString()}
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {expired.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {mrr > 0 ? money(mrr) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/plans/${plan.id}/subscribers`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/plans/${plan.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
