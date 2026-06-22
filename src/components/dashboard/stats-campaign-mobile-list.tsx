"use client";

import Link from "next/link";
import type { CampaignStatRow } from "@/lib/member-stats";

type StatsCampaignMobileListProps = {
	campaigns: CampaignStatRow[];
};

export function StatsCampaignMobileList({
	campaigns,
}: StatsCampaignMobileListProps) {
	return (
		<div className="space-y-3 lg:hidden">
			{campaigns.map((c) => (
				<div
					key={c.id}
					className="rounded-lg border border-portlet-border bg-[#f9fafb] p-4"
				>
					<Link
						href={`/brands/${c.urlId}/campaigns/${c.id}`}
						className="font-medium text-brand hover:underline"
					>
						{c.name}
					</Link>
					<p className="mt-1 text-xs text-muted-foreground">ID #{c.id}</p>
					<dl className="mt-3 grid grid-cols-3 gap-2 text-center">
						<div>
							<dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
								Participants
							</dt>
							<dd className="mt-0.5 text-sm font-semibold tabular-nums">
								{c.participants.toLocaleString()}
							</dd>
						</div>
						<div>
							<dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
								Shares
							</dt>
							<dd className="mt-0.5 text-sm font-semibold tabular-nums">
								{c.shares.toLocaleString()}
							</dd>
						</div>
						<div>
							<dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
								Clicks
							</dt>
							<dd className="mt-0.5 text-sm font-semibold tabular-nums">
								{c.clicks.toLocaleString()}
							</dd>
						</div>
					</dl>
				</div>
			))}
		</div>
	);
}
