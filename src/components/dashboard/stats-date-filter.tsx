"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StatsDateRange = "7d" | "30d" | "90d" | "all";

const RANGES: { value: StatsDateRange; label: string }[] = [
	{ value: "7d", label: "7 days" },
	{ value: "30d", label: "30 days" },
	{ value: "90d", label: "90 days" },
	{ value: "all", label: "All time" },
];

type StatsDateFilterProps = {
	value: StatsDateRange;
	onChange: (range: StatsDateRange) => void;
};

export function StatsDateFilter({ value, onChange }: StatsDateFilterProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{RANGES.map((range) => (
				<Button
					key={range.value}
					type="button"
					variant={value === range.value ? "default" : "outline"}
					size="sm"
					className={cn(
						"min-h-9",
						value === range.value &&
							"bg-brand text-white hover:bg-brand-hover"
					)}
					onClick={() => onChange(range.value)}
				>
					{range.label}
				</Button>
			))}
		</div>
	);
}
