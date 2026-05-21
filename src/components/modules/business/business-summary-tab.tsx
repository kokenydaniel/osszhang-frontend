'use client';

import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { Button } from '@/components/ui/button';
import { HELP } from '@/lib/helpTexts';
import { AccentPanel, Section } from '@/components/design';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend } from 'recharts';
import { RefreshCw, Cpu } from 'lucide-react';
import type { BusinessPageState } from '@/components/modules/business/hooks/use-business-page-state';

type BusinessSummaryTabProps = Pick<
  BusinessPageState,
  | 'selectedYear'
  | 'realAiAdvice'
  | 'isAiLoading'
  | 'handleRequestAiAdvice'
  | 'aiAdvice'
  | 'chartData'
  | 'channelData'
  | 'totalYTD'
>;

const channelColors = ['oklch(0.55 0.22 275)', 'oklch(0.62 0.22 25)', 'oklch(0.72 0.16 60)', 'oklch(0.65 0.18 150)'];

export function BusinessSummaryTab({
  selectedYear,
  realAiAdvice,
  isAiLoading,
  handleRequestAiAdvice,
  aiAdvice,
  chartData,
  channelData,
  totalYTD,
}: BusinessSummaryTabProps) {
  return (
    <div className="flex flex-col gap-7">
      <AccentPanel
        tone="ai"
        icon={Cpu}
        title="Little Loom AI stratéga"
        titleInfo={HELP.business.aiStrategist}
        description="Személyre szabott növekedési stratégia"
        glow
        action={
          <Button variant="ghost" size="xs" onClick={handleRequestAiAdvice} disabled={isAiLoading}>
            <RefreshCw size={11} className={classNames(isAiLoading && 'animate-spin')} />
            {isAiLoading ? 'Elemzés…' : 'Új elemzés'}
          </Button>
        }
      >
        {isAiLoading ? 'Az adatok elemzése és a stratégia generálása folyamatban…' : realAiAdvice || aiAdvice}
      </AccentPanel>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Section title={`Havi cashflow · ${selectedYear}`} description="Bevétel és kintlévőség havi bontásban">
            <div className="rounded-lg border border-border bg-card p-4">
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
                            {(payload as unknown as Array<{ name: string; value: number }>).map((p) => (
                              <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-foreground/70">{p.name === 'bevetel' ? 'Bevétel' : 'Kintlévőség'}</span>
                                <span className={classNames('font-semibold tabular-nums', p.name === 'bevetel' ? 'text-primary' : 'text-rose-600')}>
                                  {formatHUF(p.value)}
                                </span>
                              </div>
                            ))}
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
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section title="Csatorna megoszlás" description={`${selectedYear} év · súlyozva`}>
            <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3.5">
              {channelData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Még nincs rendelési adat.</p>
              ) : (
                channelData
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
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
