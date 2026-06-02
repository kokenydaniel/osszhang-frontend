'use client';

import Link from 'next/link';
import { formatHUF } from '@/utils';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Section } from '@/components/design';
import { ChevronRight } from 'lucide-react';
import type { DashboardChartPoint } from '@/helpers/dashboard-types';

type Props = {
  businessEnabled: boolean;
  chartData: DashboardChartPoint[];
};

export function DashboardBusinessChart({ businessEnabled, chartData }: Props) {
  if (!businessEnabled || chartData.length === 0) {
    return null;
  }

  return (
    <Section
      title="Árbevétel · utolsó 6 hónap"
      description="Vállalkozás havi forgalom trend"
      action={
        <Link href="/business" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
          Vállalkozás <ChevronRight size={11} />
        </Link>
      }
    >
      <div className="rounded-lg border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.55 0.22 275)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="oklch(0.55 0.22 275)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.004 250)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'oklch(0.50 0.012 260)' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'oklch(0.50 0.012 260)' }} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              contentStyle={{
                background: 'oklch(0.995 0.002 250)',
                border: '1px solid oklch(0.92 0.004 250)',
                borderRadius: 8,
                fontSize: 12,
                boxShadow: '0 4px 12px rgb(0 0 0 / 0.06)',
              }}
              formatter={(val) => formatHUF(Number(val ?? 0))}
            />
            <Area type="monotone" dataKey="amount" stroke="oklch(0.55 0.22 275)" strokeWidth={2} fillOpacity={1} fill="url(#aG)" activeDot={{ r: 4, fill: 'oklch(0.55 0.22 275)' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
