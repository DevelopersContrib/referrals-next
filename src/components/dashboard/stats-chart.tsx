"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export type StatsChartPoint = {
	label: string;
	value: number;
};

type StatsChartProps = {
	data: StatsChartPoint[];
	color?: string;
};

export function StatsChart({
	data,
	color = "#ff5c62",
}: StatsChartProps) {
	if (data.length === 0) {
		return (
			<div className="flex h-[220px] items-center justify-center rounded-lg bg-[#f7f8fa] text-sm text-[#a7abc3] lg:h-[280px]">
				No data for this period
			</div>
		);
	}

	return (
		<div className="w-full h-[220px] lg:h-[280px]">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart
					data={data}
					margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
				>
					<defs>
						<linearGradient id="statsGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor={color} stopOpacity={0.25} />
							<stop offset="95%" stopColor={color} stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="#ebeef0" />
					<XAxis
						dataKey="label"
						tick={{ fill: "#a7abc3", fontSize: 11 }}
						tickLine={false}
						axisLine={{ stroke: "#ebeef0" }}
						interval="preserveStartEnd"
					/>
					<YAxis
						tick={{ fill: "#a7abc3", fontSize: 11 }}
						tickLine={false}
						axisLine={false}
						allowDecimals={false}
						width={40}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "#fff",
							border: "1px solid #ebeef0",
							borderRadius: "8px",
							fontSize: "13px",
							color: "#575962",
						}}
						formatter={(value) => [
							Number(value).toLocaleString(),
							"Participants",
						]}
					/>
					<Area
						type="monotone"
						dataKey="value"
						stroke={color}
						strokeWidth={2}
						fill="url(#statsGradient)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
