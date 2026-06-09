interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  overBudget?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  overBudget = false,
  className = "",
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableHeight = height - padding * 2;
  const usableWidth = width - padding * 2;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * usableWidth;
    const y = padding + usableHeight - ((value - min) / range) * usableHeight;
    return `${x},${y}`;
  }).join(" ");

  const strokeColor = overBudget ? "#f59e0b" : "#22c55e";
  const fillGradientId = `sparkline-${overBudget ? "amber" : "green"}`;

  // Area fill path
  const firstX = padding;
  const lastX = padding + usableWidth;
  const areaPath = `M${points.split(" ")[0]} ${points.split(" ").slice(1).map((p) => `L${p}`).join(" ")} L${lastX},${height} L${firstX},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`Spending trend: ${overBudget ? "trending over budget" : "within budget"}`}
    >
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillGradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
