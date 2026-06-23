'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Label, Tooltip } from 'recharts';
import type { LabelProps } from 'recharts';
import { ProgressBar } from '@/components/design';
import type { AiTravelCostBreakdown } from '@/types/ai';
import { travelCostChartData } from '@/calculations/travel';
import { formatHUF } from '@/utils';

const COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#64748b'];

const INNER_RADIUS = 58;
const OUTER_RADIUS = 80;

type TravelCostChartProps = {
  breakdown: AiTravelCostBreakdown;
  total: number;
};

function DonutCenterLabel({ viewBox, total }: Pick<LabelProps, 'viewBox'> & { total: number }) {
  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;

  const cx = viewBox.cx ?? 0;
  const cy = viewBox.cy ?? 0;
  const totalLabel = formatHUF(total);
  const fontSize = totalLabel.length > 14 ? 11 : 13;

  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.6em" fill="var(--muted-foreground)" fontSize={10} fontWeight={500}>
        Összesen
      </tspan>
      <tspan x={cx} dy="1.35em" fill="var(--foreground)" fontSize={fontSize} fontWeight={600}>
        {totalLabel}
      </tspan>
    </text>
  );
}

export function TravelCostChart({ breakdown, total }: TravelCostChartProps) {
  const data = travelCostChartData(breakdown, total)
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (!data.length) return null;

  const chartTotal = data.reduce((sum, row) => sum + row.amount, 0) || total;

  return (
    <div className="flex flex-col items-stretch gap-5">
      <div className="mx-auto aspect-square w-full max-w-[13.5rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Tooltip
              formatter={(value) => formatHUF(Number(value ?? 0))}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                borderRadius: 8,
                fontSize: 12,
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Pie
              data={data}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={INNER_RADIUS}
              outerRadius={OUTER_RADIUS}
              paddingAngle={2}
              stroke="transparent"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
              ))}
              <Label
                content={(props: LabelProps) => <DonutCenterLabel viewBox={props.viewBox} total={chartTotal} />}
                position="center"
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-2.5">
        {data.map((row, index) => {
          const color = COLORS[index % COLORS.length];
          const percentage = chartTotal > 0 ? Math.round((row.amount / chartTotal) * 100) : 0;

          return (
            <div key={row.key} className="flex min-w-0 flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2 text-xs">
                <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 font-medium text-foreground">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="leading-snug">{row.label}</span>
                </span>
                <span className="shrink-0 text-right font-semibold tabular-nums leading-snug text-foreground">
                  <span className="block">{percentage}%</span>
                  <span className="block text-[11px] font-medium text-muted-foreground">{formatHUF(row.amount)}</span>
                </span>
              </div>
              <ProgressBar value={row.amount} max={chartTotal} size="md" barStyle={{ backgroundColor: color }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
