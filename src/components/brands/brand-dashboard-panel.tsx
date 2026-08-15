"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SimpleLineChart } from "@/components/brands/simple-line-chart";
import { defaultStatsDateRange } from "@/lib/brand-stats";
import {
  PlusIcon,
  SearchIcon,
  TrophyIcon,
  UserPlusIcon,
  MegaphoneIcon,
  Loader2Icon,
  CalendarIcon,
  ChevronRightIcon,
  AwardIcon,
  DollarSignIcon,
  EyeIcon,
  Users as UsersIcon,
  Share2Icon,
  MousePointerClickIcon,
} from "lucide-react";

export type BrandDashboardBrand = {
  id: number;
  domain: string;
  url: string;
  logo_url: string | null;
};

export type LeaderRow = {
  id: number;
  name: string;
  email: string;
  total: number;
};

export type CampaignRow = {
  id: number;
  name: string;
  date_added: string;
  publish: string | null;
};

type OverviewStats = {
  rewardedReferrals: number;
  rewardsValue: number;
  totalCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalShares: number;
  totalParticipants: number;
};

type SeriesPoint = { label: string; value: number };

interface BrandDashboardPanelProps {
  brand: BrandDashboardBrand;
  shareLeaders: LeaderRow[];
  inviteLeaders: LeaderRow[];
  campaigns: CampaignRow[];
}

function DateRangeSearch({
  from,
  to,
  onFromChange,
  onToChange,
  onSearch,
  loading,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-[#a7abc3]">From</label>
        <Input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-[#a7abc3]">To</label>
        <Input type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
      </div>
      <Button
        onClick={onSearch}
        disabled={loading}
        className="gap-2 bg-brand hover:bg-brand-hover min-h-11 w-full lg:w-auto"
      >
        {loading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <SearchIcon className="size-4" />
        )}
        Search
      </Button>
    </div>
  );
}

function OverviewStat({
  icon: Icon,
  label,
  value,
  chip,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  chip: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-[#ebeef0] bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex size-10 items-center justify-center rounded-lg ${chip}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xl font-bold leading-tight text-[#464457]">{value}</div>
        <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#a7abc3]">
          {label}
        </div>
      </div>
    </div>
  );
}

export function BrandDashboardPanel({
  brand,
  shareLeaders,
  inviteLeaders,
  campaigns,
}: BrandDashboardPanelProps) {
  const router = useRouter();
  const defaults = defaultStatsDateRange();

  const [overviewFrom, setOverviewFrom] = useState("");
  const [overviewTo, setOverviewTo] = useState("");
  const [referralsFrom, setReferralsFrom] = useState(defaults.from);
  const [referralsTo, setReferralsTo] = useState(defaults.to);
  const [sharesFrom, setSharesFrom] = useState(defaults.from);
  const [sharesTo, setSharesTo] = useState(defaults.to);

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [participantsSeries, setParticipantsSeries] = useState<SeriesPoint[]>(
    []
  );
  const [sharesSeries, setSharesSeries] = useState<SeriesPoint[]>([]);

  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [campaignQuery, setCampaignQuery] = useState("");
  const [campaignStatus, setCampaignStatus] = useState<"all" | "public" | "private">("all");
  const [campaignSort, setCampaignSort] = useState<"newest" | "oldest" | "name_asc" | "name_desc">(
    "newest"
  );

  const visibleCampaigns = useMemo(() => {
    const q = campaignQuery.trim().toLowerCase();
    const filtered = campaigns.filter((c) => {
      const status = (c.publish || "public").toLowerCase();
      if (campaignStatus !== "all" && status !== campaignStatus) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (campaignSort === "name_asc") return a.name.localeCompare(b.name);
      if (campaignSort === "name_desc") return b.name.localeCompare(a.name);
      const da = new Date(a.date_added).getTime();
      const db = new Date(b.date_added).getTime();
      return campaignSort === "oldest" ? da - db : db - da;
    });
    return sorted;
  }, [campaigns, campaignQuery, campaignStatus, campaignSort]);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      // Default to all-time (matches PHP, which shows lifetime totals up front);
      // the date pickers narrow it.
      const from = overviewFrom || "2010-01-01";
      const to = overviewTo || new Date().toISOString().slice(0, 10);
      const params = new URLSearchParams({ graph: "1", from, to });
      const res = await fetch(`/api/brands/${brand.id}/stats?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOverview({
        rewardedReferrals: data.rewardedReferrals ?? 0,
        rewardsValue: data.rewardsValue ?? 0,
        totalCampaigns: data.totalCampaigns,
        totalImpressions: data.totalImpressions,
        totalClicks: data.totalClicks,
        totalShares: data.totalShares,
        totalParticipants: data.totalParticipants,
      });
    } catch {
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  }, [brand.id, overviewFrom, overviewTo]);

  const fetchReferrals = useCallback(async () => {
    setLoadingReferrals(true);
    try {
      const params = new URLSearchParams({
        graph: "2",
        from: referralsFrom,
        to: referralsTo,
      });
      const res = await fetch(`/api/brands/${brand.id}/stats?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setParticipantsSeries(data.series ?? []);
    } catch {
      setParticipantsSeries([]);
    } finally {
      setLoadingReferrals(false);
    }
  }, [brand.id, referralsFrom, referralsTo]);

  const fetchShares = useCallback(async () => {
    setLoadingShares(true);
    try {
      const params = new URLSearchParams({
        graph: "3",
        from: sharesFrom,
        to: sharesTo,
      });
      const res = await fetch(`/api/brands/${brand.id}/stats?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSharesSeries(data.series ?? []);
    } catch {
      setSharesSeries([]);
    } finally {
      setLoadingShares(false);
    }
  }, [brand.id, sharesFrom, sharesTo]);

  useEffect(() => {
    fetchReferrals();
    fetchShares();
  }, [fetchReferrals, fetchShares]);

  // Load overview totals once on mount (all-time), like the PHP dashboard.
  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (campaigns.length === 0) {
      setCreateOpen(true);
    }
  }, [campaigns.length]);

  return (
    <div className="space-y-6">
      {/* Overview stats (graph 1) */}
      <div className="portlet p-6">
        <DateRangeSearch
          from={overviewFrom}
          to={overviewTo}
          onFromChange={setOverviewFrom}
          onToChange={setOverviewTo}
          onSearch={fetchOverview}
          loading={loadingOverview}
        />
        <div className="mt-4 min-h-[120px]">
          {loadingOverview ? (
            <div className="flex justify-center py-8">
              <Loader2Icon className="size-6 animate-spin text-brand" />
            </div>
          ) : overview ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              <OverviewStat icon={AwardIcon} label="Rewarded Referrals" value={overview.rewardedReferrals.toLocaleString()} chip="bg-brand/10 text-brand" />
              <OverviewStat icon={DollarSignIcon} label="Rewards Value" value={`$${Math.round(overview.rewardsValue).toLocaleString()}`} chip="bg-[#28a745]/10 text-[#28a745]" />
              <OverviewStat icon={MegaphoneIcon} label="Campaigns" value={overview.totalCampaigns.toLocaleString()} chip="bg-[#36a3f7]/10 text-[#36a3f7]" />
              <OverviewStat icon={EyeIcon} label="Impressions" value={overview.totalImpressions.toLocaleString()} chip="bg-[#8950fc]/10 text-[#8950fc]" />
              <OverviewStat icon={UsersIcon} label="Referrals" value={overview.totalParticipants.toLocaleString()} chip="bg-[#ff9f29]/10 text-[#ff9f29]" />
              <OverviewStat icon={Share2Icon} label="Shares" value={overview.totalShares.toLocaleString()} chip="bg-[#1dc9b7]/10 text-[#1dc9b7]" />
              <OverviewStat icon={MousePointerClickIcon} label="Clicks" value={overview.totalClicks.toLocaleString()} chip="bg-[#fd397a]/10 text-[#fd397a]" />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#a7abc3]">
              No stats available for this range.
            </p>
          )}
        </div>
      </div>

      {/* Leaders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="portlet p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrophyIcon className="size-5 text-[#ffc107]" />
            <h3 className="font-semibold text-[#575962]">Share Leaders</h3>
          </div>
          {shareLeaders.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#a7abc3]">
              No share data yet
            </p>
          ) : (
            <div className="space-y-2">
              {shareLeaders.map((leader, i) => (
                <div
                  key={leader.id}
                  className="flex items-center gap-3 rounded-md border border-[#ebeef0] p-2.5"
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#575962]">
                      {leader.name}
                    </p>
                    <p className="text-xs text-[#a7abc3]">
                      {leader.total} share{leader.total !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="portlet p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlusIcon className="size-5 text-[#28a745]" />
            <h3 className="font-semibold text-[#575962]">Invite Leaders</h3>
          </div>
          {inviteLeaders.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#a7abc3]">
              No invite data yet
            </p>
          ) : (
            <div className="space-y-2">
              {inviteLeaders.map((leader, i) => (
                <div
                  key={leader.id}
                  className="flex items-center gap-3 rounded-md border border-[#ebeef0] p-2.5"
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#28a745]/10 text-xs font-bold text-[#28a745]">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#575962]">
                      {leader.name}
                    </p>
                    <p className="text-xs text-[#a7abc3]">
                      {leader.total} invite{leader.total !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Referrals + Shares charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="portlet p-6">
          <h3 className="mb-4 font-semibold text-[#575962]">Referrals Stats</h3>
          <DateRangeSearch
            from={referralsFrom}
            to={referralsTo}
            onFromChange={setReferralsFrom}
            onToChange={setReferralsTo}
            onSearch={fetchReferrals}
            loading={loadingReferrals}
          />
          <div className="mt-4 h-[280px]">
            {loadingReferrals ? (
              <div className="flex h-full items-center justify-center">
                <Loader2Icon className="size-6 animate-spin text-brand" />
              </div>
            ) : (
              <SimpleLineChart
                labels={participantsSeries.map((p) => p.label)}
                values={participantsSeries.map((p) => p.value)}
              />
            )}
          </div>
          <p className="mt-2 text-xs text-[#a7abc3]">Participants over time</p>
        </div>

        <div className="portlet p-6">
          <h3 className="mb-4 font-semibold text-[#575962]">Shares Stats</h3>
          <DateRangeSearch
            from={sharesFrom}
            to={sharesTo}
            onFromChange={setSharesFrom}
            onToChange={setSharesTo}
            onSearch={fetchShares}
            loading={loadingShares}
          />
          <div className="mt-4 h-[280px]">
            {loadingShares ? (
              <div className="flex h-full items-center justify-center">
                <Loader2Icon className="size-6 animate-spin text-brand" />
              </div>
            ) : (
              <SimpleLineChart
                labels={sharesSeries.map((p) => p.label)}
                values={sharesSeries.map((p) => p.value)}
                color="#716ACA"
              />
            )}
          </div>
          <p className="mt-2 text-xs text-[#a7abc3]">Shares over time</p>
        </div>
      </div>

      <div className="portlet min-w-0 p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <MegaphoneIcon className="size-5 text-brand" />
            <h3 className="font-semibold text-[#575962]">Campaigns</h3>
            <span className="text-xs text-[#a7abc3]">
              {visibleCampaigns.length}
              {visibleCampaigns.length !== campaigns.length
                ? ` of ${campaigns.length}`
                : ""}
            </span>
          </div>
          <Link href={`/brands/${brand.id}/campaigns/new`}>
            <Button size="sm" className="gap-1 bg-brand text-white hover:bg-brand-hover">
              <PlusIcon className="size-3.5" />
              Create Campaign
            </Button>
          </Link>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative min-w-0">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#a7abc3]" />
            <Input
              value={campaignQuery}
              onChange={(e) => setCampaignQuery(e.target.value)}
              placeholder="Search campaigns…"
              className="h-9 pl-8"
              aria-label="Search campaigns"
            />
          </div>
          <select
            value={campaignStatus}
            onChange={(e) =>
              setCampaignStatus(e.target.value as "all" | "public" | "private")
            }
            className="h-9 rounded-lg border border-input bg-white px-2.5 text-sm text-[#575962]"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <select
            value={campaignSort}
            onChange={(e) =>
              setCampaignSort(
                e.target.value as "newest" | "oldest" | "name_asc" | "name_desc"
              )
            }
            className="h-9 rounded-lg border border-input bg-white px-2.5 text-sm text-[#575962]"
            aria-label="Sort campaigns"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
        </div>

        {campaigns.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#a7abc3]">No campaigns yet.</p>
            <Link href={`/brands/${brand.id}/campaigns/new`}>
              <Button
                size="sm"
                className="mt-3 gap-1 bg-brand text-white hover:bg-brand-hover"
              >
                <PlusIcon className="size-3" />
                Create First Campaign
              </Button>
            </Link>
          </div>
        ) : visibleCampaigns.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#a7abc3]">
            No campaigns match this search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#ebeef0] text-xs uppercase tracking-wide text-[#a7abc3]">
                  <th className="pb-2 pr-3 font-semibold">Campaign</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 pr-3 font-semibold">Added</th>
                  <th className="pb-2 text-right font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {visibleCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-[#f4f5f8] last:border-0"
                  >
                    <td className="py-3 pr-3">
                      <Link
                        href={`/brands/${brand.id}/campaigns/${campaign.id}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge
                        className={
                          campaign.publish === "public"
                            ? "border-0 bg-[#28a745]/10 text-[10px] text-[#28a745]"
                            : "border-0 bg-[#f2f3f8] text-[10px] text-[#a7abc3]"
                        }
                      >
                        {campaign.publish ?? "public"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-[#a7abc3]">
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="size-3" />
                        {new Date(campaign.date_added).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/brands/${brand.id}/campaigns/${campaign.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            Open
                            <ChevronRightIcon className="size-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/brands/${brand.id}/campaigns/${campaign.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No campaigns yet</DialogTitle>
            <DialogDescription>
              It looks like you haven&apos;t created a campaign for {brand.domain}{" "}
              yet. Would you like to set one up?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Will Create Later
            </Button>
            <Button
              className="bg-brand hover:bg-brand-hover"
              onClick={() =>
                router.push(`/brands/${brand.id}/campaigns/new`)
              }
            >
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
