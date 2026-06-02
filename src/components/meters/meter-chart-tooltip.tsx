'use client';

import { formatNumber } from '@/utils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md bg-popover border border-border px-3 py-2 shadow-md">
        <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <div className="flex flex-col gap-1">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
              <span className="text-foreground/70">{entry.name}:</span>
              <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
                {formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
