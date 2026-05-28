"use client";

type SimpleLineChartProps = {
  labels: string[];
  values: number[];
  color?: string;
  secondaryValues?: number[];
  secondaryColor?: string;
  height?: number;
};

export function SimpleLineChart({
  labels,
  values,
  color = "#5867dd",
  secondaryValues,
  secondaryColor = "#36a3f7",
  height = 220,
}: SimpleLineChartProps) {
  if (labels.length === 0 || values.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[#a7abc3]">No data</p>
    );
  }

  if (labels.length === 1) {
    return (
      <p className="py-12 text-center text-sm font-medium text-[#28a745]">
        {labels[0]}: {values[0]} {values[0] === 1 ? "entry" : "entries"}
      </p>
    );
  }

  const width = 600;
  const pad = 24;
  const allValues = [...values, ...(secondaryValues ?? [])];
  const max = Math.max(...allValues, 1);
  const min = 0;

  const xStep = (width - pad * 2) / Math.max(labels.length - 1, 1);

  function toPoints(data: number[]) {
    return data
      .map((v, i) => {
        const x = pad + i * xStep;
        const y = height - pad - ((v - min) / (max - min)) * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Stats chart"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        points={toPoints(values)}
      />
      {secondaryValues && (
        <polyline
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2.5"
          points={toPoints(secondaryValues)}
        />
      )}
      {values.map((v, i) => {
        const x = pad + i * xStep;
        const y = height - pad - ((v - min) / (max - min)) * (height - pad * 2);
        return (
          <circle key={i} cx={x} cy={y} r="3.5" fill={color} />
        );
      })}
    </svg>
  );
}
