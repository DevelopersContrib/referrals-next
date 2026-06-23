import Link from "next/link";
import {
  getSubscriptionStats,
  listSubscriptions,
  type SubStatus,
} from "@/lib/admin-subscriptions";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { CancelSubscriptionButton } from "@/components/admin/cancel-subscription-button";

export const dynamic = "force-dynamic";

function money(n: number | null | undefined, currency?: string | null) {
  if (n == null) return "—";
  return `${n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })}${
    currency && currency !== "USD" ? ` ${currency}` : ""
  }`;
}

const STATUS_STYLES: Record<SubStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  incomplete: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const { page: pageParam, status, q } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const [stats, data] = await Promise.all([
    getSubscriptionStats(),
    listSubscriptions({ page, status, search: q }),
  ]);

  const qs = (extra: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, String(v));
    }
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  const statCards = [
    { label: "Active", value: stats.active.toLocaleString(), tone: "text-emerald-600" },
    { label: "MRR", value: money(stats.mrr), tone: "text-foreground" },
    { label: "Pending", value: stats.pending.toLocaleString(), tone: "text-amber-600" },
    { label: "Cancelled", value: stats.cancelled.toLocaleString(), tone: "text-rose-600" },
    { label: "New this month", value: stats.newThisMonth.toLocaleString(), tone: "text-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {stats.total.toLocaleString()} PayPal recurring agreements — status reflects the live billing lifecycle.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${s.tone}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((t) => {
            const active = (status || "") === t.key;
            return (
              <Link
                key={t.key || "all"}
                href={`/admin/subscriptions${qs({ status: t.key || undefined, page: undefined })}`}
              >
                <Button variant={active ? "default" : "outline"} size="sm" className="h-8">
                  {t.label}
                </Button>
              </Link>
            );
          })}
        </div>
        <form className="flex gap-2" action="/admin/subscriptions">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <Input
            name="q"
            placeholder="Search member name or email"
            defaultValue={q || ""}
            className="h-8 w-64 max-w-full"
          />
          <Button type="submit" size="sm" className="h-8">Search</Button>
          {q ? (
            <Link href={`/admin/subscriptions${qs({ q: undefined, page: undefined })}`}>
              <Button type="button" variant="ghost" size="sm" className="h-8">Clear</Button>
            </Link>
          ) : null}
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">ID</TableHead>
                <TableHead>Subscriber</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Renews / Expires</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.id}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/members/${s.memberId}/edit`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {s.memberName || `Member #${s.memberId}`}
                    </Link>
                    <div className="text-xs text-muted-foreground">{s.memberEmail}</div>
                    {s.agreementId ? (
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {s.agreementId}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.planName || "—"}
                    {s.planPrice != null ? (
                      <div className="text-xs text-muted-foreground">{money(s.planPrice)}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{money(s.amount, s.currency)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_STYLES[s.status]}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.startedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.planExpiry
                      ? new Date(s.planExpiry).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === "active" || s.status === "pending" ? (
                      <div className="flex justify-end">
                        <CancelSubscriptionButton
                          subscriptionId={s.id}
                          memberEmail={s.memberEmail}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={`/admin/subscriptions${qs({ page: page - 1 })}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          ) : null}
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>
          {page < data.totalPages ? (
            <Link href={`/admin/subscriptions${qs({ page: page + 1 })}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
