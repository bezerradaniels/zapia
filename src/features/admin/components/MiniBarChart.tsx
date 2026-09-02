import { useState } from "react";

export type AnalyticsDataPoint = {
  label: string;
  value: number;
};

type Props = {
  data: AnalyticsDataPoint[];
  color?: string;
  formatValue?: (v: number) => string;
  height?: number;
  type?: "line" | "bar";
  emptyMessage?: string;
};

export function MiniBarChart({
  data,
  color = "#1a73e8",
  formatValue = (v) => String(v),
  height = 140,
  type = "line",
  emptyMessage = "Sem dados no período",
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-[#80868b]"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const paddingBottom = 24;
  const chartHeight = height - paddingBottom;
  const width = 100; // SVG viewBox coordinate system (0 to 100%)

  // If we have single or few data points for line chart, compute coordinates
  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? 50
        : (i / (data.length - 1)) * (width - 16) + 8;
    const y =
      chartHeight - 8 - (d.value / maxValue) * (chartHeight - 20);
    return { x, y, ...d };
  });

  // Create SVG path for line
  const linePath =
    points.length === 1
      ? `M 0 ${points[0].y} L 100 ${points[0].y}`
      : points.reduce(
          (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
          "",
        );

  // Create SVG path for gradient area
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
      : "";

  if (type === "bar") {
    return (
      <div className="relative flex flex-col justify-end" style={{ height }}>
        {/* Horizontal subtle grid lines */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 top-2 flex flex-col justify-between opacity-40">
          <div className="border-b border-dashed border-[#dadce0]" />
          <div className="border-b border-dashed border-[#dadce0]" />
          <div className="border-b border-[#dadce0]" />
        </div>

        <div className="relative z-10 flex h-full items-end gap-1.5 px-2 pb-6">
          {data.map((d, i) => {
            const pct = d.value / maxValue;
            const barH = Math.max(4, Math.round(pct * (chartHeight - 16)));
            const isHovered = hoveredIdx === i;

            return (
              <div
                key={d.label + i}
                className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-8 z-30 rounded-md bg-[#202124] px-2 py-1 text-[10px] font-medium text-white shadow-md whitespace-nowrap">
                    {d.label}: {formatValue(d.value)}
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full max-w-[28px] rounded-t-[3px] transition-all"
                  style={{
                    height: barH,
                    backgroundColor: isHovered ? "#174ea6" : color,
                    opacity: isHovered ? 1 : 0.88,
                  }}
                />

                {/* X-axis Label */}
                <span className="absolute -bottom-5 max-w-[40px] truncate text-center text-[10px] font-medium text-[#5f6368]">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: GA4 Line + Area Chart
  return (
    <div className="relative flex flex-col justify-end select-none" style={{ height }}>
      {/* Horizontal subtle grid lines */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 top-2 flex flex-col justify-between opacity-40">
        <div className="border-b border-dashed border-[#dadce0]" />
        <div className="border-b border-dashed border-[#dadce0]" />
        <div className="border-b border-[#dadce0]" />
      </div>

      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        preserveAspectRatio="none"
        className="relative z-10 h-[calc(100%-24px)] w-full overflow-visible"
      >
        <defs>
          <linearGradient id="ga4Gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1a73e8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Fill Area */}
        {areaPath && <path d={areaPath} fill="url(#ga4Gradient)" />}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#1a73e8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Points & Hover Target */}
        {points.map((p, i) => (
          <g key={p.label + i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 4 : 2.5}
              fill="#ffffff"
              stroke="#1a73e8"
              strokeWidth="2"
              className="transition-all"
            />
          </g>
        ))}
      </svg>

      {/* Interactive hover overlay & labels */}
      <div className="relative z-20 flex w-full justify-between px-2 pt-1 border-t border-[#dadce0]">
        {data.map((d, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={d.label + i}
              className="relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div className="absolute -top-14 z-30 rounded-md bg-[#202124] px-2.5 py-1 text-[11px] font-medium text-white shadow-lg whitespace-nowrap">
                  <span className="text-gray-300">{d.label}: </span>
                  <span className="font-semibold">{formatValue(d.value)}</span>
                </div>
              )}
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isHovered ? "text-[#1a73e8] font-semibold" : "text-[#5f6368]"
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
