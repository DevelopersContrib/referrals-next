import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getExcludedMemberIds } from "@/lib/platform-admin";
import { monthlyPrice } from "@/lib/revenue";
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
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default async function PlanSubscribersPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const id = parseInt(planId, 10);
  if (!Number.isFinite(id)) notFound();

  const plan = await prisma.plans.findUnique({ where: { id } });
  if (!plan) notFound();

  const now = new Date();
  const excludedIds = await getExcludedMemberIds();

  const members = await prisma.members.findMany({
    where: {
      plan_id: id,
      ...(excludedIds.length ? { id: { notIn: excludedIds } } : {}),
    },
    orderBy: [{ plan_expiry: "desc" }, { date_signedup: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      date_signedup: true,
      plan_expiry: true,
      is_verified: true,
    },
  });

  const active = members.filter((m) => m.plan_expiry && m.plan_expiry > now);
  const expired = members.filter((m) => !m.plan_expiry || m.plan_expiry <= now);
  const mrr = active.length * monthlyPrice(plan);

  const summary = [
    { label: "Active", value: active.length.toLocaleString() },
    { label: "Expired / lapsed", value: expired.length.toLocaleString() },
    { label: "MRR (est.)", value: money(mrr) },
    {
      label: "Plan price",
      value: plan.price ? `$${plan.price.toFixed(2)}${plan.days ? ` / ${plan.days}d` : ""}` : "Free",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/plans"
            className="mb-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to plans
          </Link>
          <h1 className="text-2xl font-bold">{plan.name || `Plan #${plan.id}`} — subscribers</h1>
          <p className="text-muted-foreground">
            Excludes team &amp; test accounts.
          </p>
        </div>
        <Link href={`/admin/plans/${plan.id}/edit`}>
          <Button variant="outline">Edit plan</Button>
        </Link>
      </div>

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
          <CardTitle className="text-base">
            {members.length.toLocaleString()} subscriber{members.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Signed up</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const isActive = !!m.plan_expiry && m.plan_expiry > now;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/members/${m.id}/edit`}
                        className="hover:underline"
                      >
                        {m.name || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>{fmtDate(m.date_signedup)}</TableCell>
                    <TableCell>{fmtDate(m.plan_expiry)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Expired"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No subscribers on this plan.
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
