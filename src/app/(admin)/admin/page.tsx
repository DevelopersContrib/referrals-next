import Link from "next/link";
import { getAdminPlatformStats } from "@/lib/admin-stats";
import { fmtNumber as fmt, fmtMoney as money } from "@/lib/admin-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  Megaphone,
  UserPlus,
  Share2,
  MousePointerClick,
  Eye,
  Award,
  DollarSign,
  BadgeCheck,
  CreditCard,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from "lucide-react";

// Always render fresh — admin stats should never be statically cached.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminPlatformStats();
  const { totals, members, revenue } = stats;

  const primary: {
    label: string;
    value: string;
    icon: LucideIcon;
    chip: string;
    sub?: string;
  }[] = [
    {
      label: "Members",
      value: fmt(totals.members),
      icon: Users,
      chip: "bg-blue-50 text-blue-600",
      sub: `${fmt(members.verified)} verified`,
    },
    {
      label: "Brands",
      value: fmt(totals.brands),
      icon: Building2,
      chip: "bg-violet-50 text-violet-600",
    },
    {
      label: "Campaigns",
      value: fmt(totals.campaigns),
      icon: Megaphone,
      chip: "bg-amber-50 text-amber-600",
      sub: `+${fmt(stats.campaignsNewThisMonth)} this month`,
    },
    {
      label: `Revenue (${new Date().getFullYear()})`,
      value: money(revenue.thisYear),
      icon: DollarSign,
      chip: "bg-emerald-50 text-emerald-600",
      sub: `${money(revenue.thisMonth)} this month · ${fmt(revenue.paidCountThisYear)} payments`,
    },
  ];

  const secondary: {
    label: string;
    value: string;
    icon: LucideIcon;
    chip: string;
  }[] = [
    { label: "Participants", value: fmt(totals.participants), icon: UserPlus, chip: "bg-sky-50 text-sky-600" },
    { label: "Shares", value: fmt(totals.shares), icon: Share2, chip: "bg-pink-50 text-pink-600" },
    { label: "Clicks", value: fmt(totals.clicks), icon: MousePointerClick, chip: "bg-indigo-50 text-indigo-600" },
    { label: "Impressions", value: fmt(totals.impressions), icon: Eye, chip: "bg-cyan-50 text-cyan-600" },
    { label: "Rewarded Referrals", value: fmt(totals.rewardedReferrals), icon: Award, chip: "bg-orange-50 text-orange-600" },
    { label: "Rewards Value", value: money(totals.rewardsValue), icon: BadgeCheck, chip: "bg-teal-50 text-teal-600" },
    { label: "MRR (est.)", value: money(revenue.mrr), icon: DollarSign, chip: "bg-emerald-50 text-emerald-600" },
    { label: "Active Subscribers", value: fmt(members.activeSubscribers), icon: CreditCard, chip: "bg-green-50 text-green-600" },
    { label: "New Members (mo)", value: fmt(members.newThisMonth), icon: UserPlus, chip: "bg-fuchsia-50 text-fuchsia-600" },
  ];

  const maxSeries = Math.max(1, ...stats.memberSeries.map((p) => p.value));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live platform-wide overview — computed from the database, excluding team
            &amp; test accounts. Revenue counts captured payments only.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {members.growthPct >= 0 ? (
            <ArrowUpRight className="size-3.5 text-emerald-600" />
          ) : (
            <ArrowDownRight className="size-3.5 text-rose-600" />
          )}
          <span className={members.growthPct >= 0 ? "text-emerald-600" : "text-rose-600"}>
            {members.growthPct >= 0 ? "+" : ""}
            {members.growthPct}%
          </span>
          new members vs last month
        </span>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
                {s.sub ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
                ) : null}
              </div>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${s.chip}`}>
                <s.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {secondary.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border bg-card p-3.5"
          >
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${s.chip}`}>
              <s.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Member growth (last 12 months) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New members — last 12 months</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.memberSeries.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No signup data in range.
              </p>
            ) : (
              // Pixel heights (not %) — % height collapses inside flex children.
              <div className="flex h-44 items-end gap-1.5">
                {stats.memberSeries.map((p, i) => {
                  const barPx =
                    p.value === 0
                      ? 2
                      : Math.max(8, Math.round((p.value / maxSeries) * 140));
                  return (
                    <div
                      key={i}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                      title={`${p.label}: ${fmt(p.value)}`}
                    >
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {p.value > 0 ? fmt(p.value) : ""}
                      </span>
                      <div
                        className="w-full min-w-[8px] max-w-[40px] rounded-t bg-[#ff5c62] transition-all hover:bg-[#e84b51]"
                        style={{ height: `${barPx}px` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{p.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent signups */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent signups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              stats.recentSignups.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/members/${m.id}/edit`}
                  className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold uppercase text-brand">
                    {(m.name || m.email || "?").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name || "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(m.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top brands */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="size-4 text-amber-500" />
              Top brands by campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.topBrands.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              stats.topBrands.map((b, i) => (
                <Link
                  key={b.id}
                  href={`/admin/brands/${b.id}/edit`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium">{b.domain}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {fmt(b.campaigns)} campaigns
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top campaigns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="size-4 text-cyan-500" />
              Top campaigns by impressions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.topCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              stats.topCampaigns.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/admin/campaigns/${c.id}/edit`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium">{c.name}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {fmt(c.impressions)} views
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
