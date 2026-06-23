"use client";

import { useCallback, useEffect, useState } from "react";
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
  ArrowRightIcon,
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

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 text-center">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="mt-1 text-xs font-semibold text-[#575962]">{label}</div>
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              <OverviewStat label="Rewarded Referrals" value={overview.rewardedReferrals.toLocaleString()} />
              <OverviewStat label="Rewards Value" value={`$${Math.round(overview.rewardsValue).toLocaleString()}`} />
              <OverviewStat label="Campaigns" value={overview.totalCampaigns.toLocaleString()} />
              <OverviewStat label="Impressions" value={overview.totalImpressions.toLocaleString()} />
              <OverviewStat label="Referrals" value={overview.totalParticipants.toLocaleString()} />
              <OverviewStat label="Shares" value={overview.totalShares.toLocaleString()} />
              <OverviewStat label="Clicks" value={overview.totalClicks.toLocaleString()} />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#a7abc3]">
              No stats available for this range.
            </p>
          )}
        </div>
      </div>

      {/* Leaders + latest campaigns */}
      <div className="grid gap-6 lg:grid-cols-3">
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

        <div className="portlet p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="size-5 text-brand" />
              <h3 className="font-semibold text-[#575962]">Latest Campaigns</h3>
            </div>
            <Link href={`/brands/${brand.id}/campaigns`}>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-brand">
                All <ArrowRightIcon className="size-3" />
              </Button>
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="py-6 text-center">
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
          ) : (
            <div className="space-y-2">
              {campaigns.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/brands/${brand.id}/campaigns/${campaign.id}`}
                  className="block rounded-md border border-[#ebeef0] p-2.5 transition-colors hover:border-brand/30 hover:bg-brand/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#575962]">
                        {campaign.name}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <CalendarIcon className="size-3 text-[#a7abc3]" />
                        <p className="text-xs text-[#a7abc3]">
                          {new Date(campaign.date_added).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        campaign.publish === "public"
                          ? "border-0 bg-[#28a745]/10 text-[10px] text-[#28a745]"
                          : "border-0 bg-[#f2f3f8] text-[10px] text-[#a7abc3]"
                      }
                    >
                      {campaign.publish ?? "public"}
                    </Badge>
                  </div>
                </Link>
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
