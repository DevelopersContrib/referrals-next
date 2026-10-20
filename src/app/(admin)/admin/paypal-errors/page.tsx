import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "PayPal errors" };

type Props = { searchParams: Promise<{ op?: string; days?: string }> };

const fmt = (d: Date) =>
  d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** Request time for this server render (kept out of the component body). */
function requestTime(): number {
  return Date.now();
}

/**
 * PayPal problems in one place: errors PayPal's API returned to our server
 * (paypal_api_log, written by src/lib/paypal.ts) and errors from the PayPal
 * button in members' browsers (billing_checkout_events).
 */
export default async function PaypalErrorsPage({ searchParams }: Props) {
  const { op, days: daysParam } = await searchParams;
  const days = [1, 7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 7;
  const since = new Date(requestTime() - days * 86_400_000);

  const apiWhere = { created_at: { gte: since }, ...(op ? { operation: op } : {}) };
  const [apiRows, apiByOp, checkoutRows] = await Promise.all([
    prisma.paypal_api_log
      .findMany({ where: apiWhere, orderBy: { id: "desc" }, take: 200 })
      .catch(() => null),
    prisma.paypal_api_log
      .groupBy({
        by: ["operation"],
        where: { created_at: { gte: since } },
        _count: { _all: true },
      })
      .catch(() => [] as { operation: string; _count: { _all: number } }[]),
    prisma.billing_checkout_events.findMany({
      where: {
        created_at: { gte: since },
        OR: [{ error_code: { not: null } }, { event_name: { in: ["client_error", "server_error"] } }],
      },
      orderBy: { id: "desc" },
      take: 200,
    }),
  ]);

  const memberIds = [...new Set(checkoutRows.map((r) => r.member_id))];
  const members = memberIds.length
    ? await prisma.members.findMany({ where: { id: { in: memberIds } }, select: { id: true, email: true } })
    : [];
  const emailOf = new Map(members.map((m) => [m.id, m.email]));
  const tableMissing = apiRows === null;
  const ops = [...apiByOp].sort((a, b) => b._count._all - a._count._all);
  const apiTotal = ops.reduce((sum, r) => sum + r._count._all, 0);

  const range = (d: number) =>
    `/admin/paypal-errors?days=${d}${op ? `&op=${encodeURIComponent(op)}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">PayPal errors</h1>
          <p className="text-sm text-muted-foreground">
            Errors PayPal returned to our server, and errors from the PayPal button during checkout.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1 text-sm">
          {[1, 7, 30, 90].map((d) => (
            <Link
              key={d}
              href={range(d)}
              className={`rounded-md px-3 py-1.5 ${d === days ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >
              {d === 1 ? "24 hours" : `${d} days`}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">PayPal API errors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{tableMissing ? "–" : apiTotal}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Checkout errors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{checkoutRows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most frequent</CardTitle>
          </CardHeader>
          <CardContent className="truncate text-lg font-semibold">
            {ops[0] ? `${ops[0].operation} (${ops[0]._count._all})` : "None"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>PayPal API errors</CardTitle>
          {ops.length > 0 && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Link
                href={`/admin/paypal-errors?days=${days}`}
                className={`rounded-full border px-2.5 py-1 ${!op ? "bg-foreground text-background" : "hover:bg-muted"}`}
              >
                All
              </Link>
              {ops.map((o) => (
                <Link
                  key={o.operation}
                  href={`/admin/paypal-errors?days=${days}&op=${encodeURIComponent(o.operation)}`}
                  className={`rounded-full border px-2.5 py-1 ${op === o.operation ? "bg-foreground text-background" : "hover:bg-muted"}`}
                >
                  {o.operation} · {o._count._all}
                </Link>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {tableMissing ? (
            <p className="text-sm text-muted-foreground">
              The paypal_api_log table hasn&apos;t been created yet (prisma/sql/paypal_api_log.sql).
            </p>
          ) : apiRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PayPal API errors in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PayPal error</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Debug id</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiRows.map((r) => (
                  <TableRow key={String(r.id)}>
                    <TableCell className="whitespace-nowrap text-xs">{fmt(r.created_at)}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {r.operation}
                      {r.mode !== "live" && <Badge variant="outline" className="ml-1">{r.mode}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status >= 500 || r.status === 0 ? "destructive" : "secondary"}>
                        {r.status === 0 ? "no response" : r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md text-xs">
                      {r.error_name && <span className="font-semibold">{r.error_name}: </span>}
                      {r.message || "–"}
                      {r.details && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-muted-foreground">Details</summary>
                          <pre className="mt-1 whitespace-pre-wrap break-all text-[11px]">{r.details}</pre>
                        </details>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[16rem] break-all font-mono text-[11px]">
                      {r.method} {r.path}
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">{r.debug_id || "–"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checkout errors</CardTitle>
        </CardHeader>
        <CardContent>
          {checkoutRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No checkout errors in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Where</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Plan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkoutRows.map((r) => (
                  <TableRow key={String(r.id)}>
                    <TableCell className="whitespace-nowrap text-xs">{fmt(r.created_at)}</TableCell>
                    <TableCell className="text-xs">
                      {r.event_name === "client_error" ? "Browser" : "Server"}
                      {r.checkout_mode ? ` · ${r.checkout_mode}` : ""}
                    </TableCell>
                    <TableCell className="max-w-md text-xs">
                      {r.error_code && <span className="font-semibold">{r.error_code}: </span>}
                      {r.error_message || "–"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Link href={`/admin/members/${r.member_id}`} className="hover:underline">
                        {emailOf.get(r.member_id) || `#${r.member_id}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">#{r.plan_id}</TableCell>
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
