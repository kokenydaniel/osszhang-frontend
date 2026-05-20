'use client';

import { useId } from 'react';

interface SparklineProps {
  values: number[];
  height?: number;
  width?: number;
  stroke?: string;
  fill?: string;
  positive?: boolean;
  showDot?: boolean;
  className?: string;
}

export function Sparkline({
  values,
  height = 32,
  width = 88,
  stroke,
  fill,
  positive,
  showDot = true,
  className,
}: SparklineProps) {
  const uid = useId().replace(/:/g, '');
  const gradientId = `spark-${uid}`;

  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  const last = points[points.length - 1];

  const auto = positive === undefined ? values[values.length - 1] >= values[0] : positive;
  const strokeColor = stroke || (auto ? 'oklch(0.65 0.18 150)' : 'oklch(0.62 0.22 25)');
  const fillStart = fill || (auto ? 'oklch(0.65 0.18 150 / 0.20)' : 'oklch(0.62 0.22 25 / 0.20)');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillStart} stopOpacity={1} />
          <stop offset="100%" stopColor={fillStart} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <circle cx={last[0]} cy={last[1]} r={2.5} fill={strokeColor} stroke="white" strokeWidth={1.5} />
      )}
    </svg>
  );
}
