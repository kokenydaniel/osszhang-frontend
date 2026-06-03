'use client';

import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { Button } from '@/components/ui/button';
import { HELP } from '@/config/help';
import { AccentPanel, SectionPanel, ProgressBar } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend } from 'recharts';
import { aiFeatureLabel } from '@/config/ai-features';
import { RefreshCw, Cpu, BarChart3, PieChart } from 'lucide-react';
import { BusinessAnnualTaxPanel } from '@/components/business/business-annual-tax-panel';
import type { BusinessSettings } from '@/settings/business';
import type { BusinessOrder } from '@/types/business';

export type BusinessSummaryTabProps = {
  businessName: string;
  selectedYear: number;
  realAiAdvice: string | null;
  isAiLoading: boolean;
  requestAiAdvice: () => void | Promise<void>;
  aiAdvice: string;
  chartData: Array<{ name: string; bevetel: number; kintlevoseg: number }>;
  channelData: Array<{ name: string; value: number }>;
  totalYTD: number;
  orders: BusinessOrder[];
  bizSettings: BusinessSettings;
  channelTotal?: number;
};

const channelColors = ['oklch(0.55 0.22 275)', 'oklch(0.62 0.22 25)', 'oklch(0.72 0.16 60)', 'oklch(0.65 0.18 150)'];

function cashflowBarKey(dataKey: unknown, name: unknown): string {
  if (typeof dataKey === 'string' || typeof dataKey === 'number') return String(dataKey);
  if (typeof name === 'string') return name;
  return '';
}

function cashflowBarMeta(dataKey: unknown, name: unknown) {
  const key = cashflowBarKey(dataKey, name);
  const isBevetel = key === 'bevetel' || key === 'Bevétel';
  return {
    label: isBevetel ? 'Bevétel' : 'Kintlévőség',
    isBevetel,
  };
}

export function BusinessSummaryTab({
  businessName,
  selectedYear,
  realAiAdvice,
  isAiLoading,
  requestAiAdvice,
  aiAdvice,
  chartData,
  channelData,
  totalYTD,
  orders,
  bizSettings,
  channelTotal,
}: BusinessSummaryTabProps) {
  const pieTotal = channelTotal ?? totalYTD;
  const aiTitle = `${businessName} — ${aiFeatureLabel('business_revenue_analysis')}`;

  return (
    <div className="flex flex-col gap-7">
      <BusinessAnnualTaxPanel
        selectedYear={selectedYear}
        orders={orders}
        bizSettings={bizSettings}
      />

      <TierGatedAiPanel
        featureLabel={aiFeatureLabel('business_revenue_analysis')}
        icon={Cpu}
        title={aiTitle}
        titleInfo={HELP.business.aiStrategist}
        description="Személyre szabott növekedési stratégia"
        glow
        action={
          <TierGatedButton
            feature="ai"
            featureLabel={aiFeatureLabel('business_revenue_analysis')}
            variant="ghost"
            size="xs"
            onClick={requestAiAdvice}
            disabled={isAiLoading}
          >
            <RefreshCw size={11} className={classNames(isAiLoading && 'animate-spin')} />
            {isAiLoading ? 'Elemzés…' : 'Új elemzés'}
          </TierGatedButton>
        }
      >
        <AccentPanel
          tone="ai"
          icon={Cpu}
          title={aiTitle}
          titleInfo={HELP.business.aiStrategist}
          description="Személyre szabott növekedési stratégia"
          glow
          action={
            <Button variant="ghost" size="xs" onClick={requestAiAdvice} disabled={isAiLoading}>
              <RefreshCw size={11} className={classNames(isAiLoading && 'animate-spin')} />
              {isAiLoading ? 'Elemzés…' : 'Új elemzés'}
            </Button>
          }
        >
          {isAiLoading ? 'Az adatok elemzése és a stratégia generálása folyamatban…' : realAiAdvice || aiAdvice}
        </AccentPanel>
      </TierGatedAiPanel>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SectionPanel
            title={`Havi cashflow · ${selectedYear}`}
            description="Bevétel és kintlévőség havi bontásban"
            icon={BarChart3}
            tone="primary"
            noPadding
            className="shadow-soft"
          >
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.004 250)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.50 0.012 260)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} tick={{ fill: 'oklch(0.50 0.012 260)', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'oklch(0.965 0.005 250)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-md bg-popover border border-border px-3 py-2 shadow-md">
                            <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                              {label} havi mérleg
                            </p>
                            {payload.map((p, i) => {
                                const meta = cashflowBarMeta(p.dataKey, p.name);
                                return (
                                  <div key={`${String(p.dataKey ?? i)}-${i}`} className="flex items-center justify-between gap-4 text-xs">
                                    <span className="text-foreground/70">{meta.label}</span>
                                    <span
                                      className={classNames(
                                        'font-semibold tabular-nums',
                                        meta.isBevetel ? 'text-primary' : 'text-rose-600',
                                      )}
                                    >
                                      {formatHUF(Number(p.value) || 0)}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: 11 }} />
                  <Bar dataKey="bevetel" fill="oklch(0.55 0.22 275)" name="Bevétel" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="kintlevoseg" fill="oklch(0.62 0.22 25)" name="Kintlévőség" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionPanel>
        </div>

        <div className="lg:col-span-2">
          <SectionPanel
            title="Csatorna megoszlás"
            description={`${selectedYear} év · súlyozva`}
            icon={PieChart}
            tone="info"
            className="shadow-soft h-full"
          >
            {channelData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Még nincs rendelési adat.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {channelData
                  .sort((a, b) => b.value - a.value)
                  .map((c, i) => {
                    const percentage = totalYTD > 0 ? Math.round((c.value / totalYTD) * 100) : 0;
                    const color = channelColors[i % channelColors.length];
                    return (
                      <div key={c.name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground min-w-0 truncate">
                            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: color }} />
                            <span className="truncate">{c.name}</span>
                          </span>
                          <span className="font-semibold text-foreground tabular-nums shrink-0">
                            {percentage}% · {formatHUF(c.value)}
                          </span>
                        </div>
                        <ProgressBar value={c.value} max={pieTotal} size="md" barStyle={{ backgroundColor: color }} />
                      </div>
                    );
                  })}
              </div>
            )}
          </SectionPanel>
        </div>
      </div>
    </div>
  );
}
