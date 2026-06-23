"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsChart, type StatsChartPoint } from "@/components/dashboard/stats-chart";
import {
	StatsDateFilter,
	type StatsDateRange,
} from "@/components/dashboard/stats-date-filter";

type StatsPerformanceSectionProps = {
	chartData: StatsChartPoint[];
};

function filterByRange(
	data: StatsChartPoint[],
	range: StatsDateRange
): StatsChartPoint[] {
	if (range === "all" || data.length === 0) return data;

	const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);

	return data.filter((point) => {
		const parsed = new Date(point.label);
		if (Number.isNaN(parsed.getTime())) return true;
		return parsed >= cutoff;
	});
}

export function StatsPerformanceSection({
	chartData,
}: StatsPerformanceSectionProps) {
	const [range, setRange] = useState<StatsDateRange>("30d");

	const filteredData = useMemo(
		() => filterByRange(chartData, range),
		[chartData, range]
	);

	return (
		<Card>
			<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<CardTitle>Performance Over Time</CardTitle>
				<StatsDateFilter value={range} onChange={setRange} />
			</CardHeader>
			<CardContent>
				{/* TODO: wire date filter to server-side time-series API */}
				<StatsChart data={filteredData} />
				<p className="mt-2 text-xs text-[#a7abc3]">
					Participants over time across all campaigns
				</p>
			</CardContent>
		</Card>
	);
}
