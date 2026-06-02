'use client';

import classNames from 'classnames';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
} from 'recharts';
import { BarChart3, Tag, TrendingDown } from 'lucide-react';
import { formatHUF } from '@/utils';
import { HELP } from '@/config/help';
import { SectionPanel, ProgressBar, EmptyState } from '@/components/design';
import {
  BUDGET_YEAR_CHART_COLORS,
  type BudgetYearInsight,
  type BudgetYearSnapshot,
} from '@/calculations/budget-year';
import { BudgetYearInsightsPanel } from './budget-year-insights-panel';
import { BudgetYearAiPanel } from './budget-year-ai-panel';
import { BudgetYearExtraPanels } from './budget-year-extra-panels';

type BudgetYearTabProps = {
  selectedYear: number;
  previousYear: number;
  snapshot: BudgetYearSnapshot;
  insights: BudgetYearInsight[];
  showDebts: boolean;
  showSavings: boolean;
  categoryColor?: (name: string) => string | undefined;
};

function chartSeriesLabel(dataKey: string | number | undefined): string {
  if (dataKey === 'kiadas') return 'Kiadás';
  if (dataKey === 'bevetel') return 'Bevétel';
  return 'Összeg';
}

export function BudgetYearTab({
  selectedYear,
  previousYear,
  snapshot,
  insights,
  showDebts,
  showSavings,
  categoryColor,
}: BudgetYearTabProps) {
  const maxCategory = snapshot.categoryRows.length
    ? Math.max(...snapshot.categoryRows.map((row) => row.value))
    : 0;

  return (
    <div className="flex flex-col gap-7">
      <BudgetYearAiPanel selectedYear={selectedYear} snapshot={snapshot} />
      <BudgetYearInsightsPanel insights={insights} />

      <BudgetYearExtraPanels
        selectedYear={selectedYear}
        snapshot={snapshot}
        showDebts={showDebts}
        showSavings={showSavings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SectionPanel
            title={`Havi cashflow · ${selectedYear}`}
            description="Kifizetett kiadások és bevételek havi bontásban"
            icon={BarChart3}
            tone="primary"
            noPadding
            className="shadow-soft"
          >
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={snapshot.monthlyChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.004 250)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.50 0.012 260)', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000}k`}
                    tick={{ fill: 'oklch(0.50 0.012 260)', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'oklch(0.965 0.005 250)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md bg-popover border border-border px-3 py-2 shadow-md">
                          <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                            {label} · {selectedYear}
                          </p>
                          {payload.map((entry) => {
                            const dataKey = entry.dataKey as string | undefined;
                            const value = Number(entry.value ?? 0);
                            const seriesLabel = chartSeriesLabel(dataKey);
                            return (
                              <div
                                key={String(dataKey)}
                                className="flex items-center justify-between gap-4 text-xs"
                              >
                                <span className="text-foreground/70">{seriesLabel}</span>
                                <span
                                  className={classNames(
                                    'font-semibold tabular-nums',
                                    dataKey === 'kiadas' ? 'text-rose-600' : 'text-emerald-600',
                                  )}
                                >
                                  {formatHUF(value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: 11 }} />
                  <Bar
                    dataKey="kiadas"
                    fill={BUDGET_YEAR_CHART_COLORS.expense}
                    name="Kiadás"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="bevetel"
                    fill={BUDGET_YEAR_CHART_COLORS.income}
                    name="Bevétel"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionPanel>
        </div>

        <div className="lg:col-span-2">
          <SectionPanel
            title="Kategória megoszlás"
            description={`${selectedYear} · kifizetett kiadások`}
            icon={Tag}
            tone="info"
            info={HELP.budget.yearCategory}
            className="shadow-soft h-full"
          >
            {snapshot.categoryRows.length === 0 ? (
              <EmptyState
                icon={TrendingDown}
                title="Még nincs éves adat"
                description="A kifizetett kiadások és rezsi tételek itt jelennek meg kategóriánként."
              />
            ) : (
              <div className="flex flex-col gap-3.5">
                {snapshot.categoryRows.map((row, index) => {
                  const color =
                    categoryColor?.(row.name) ??
                    BUDGET_YEAR_CHART_COLORS.bars[index % BUDGET_YEAR_CHART_COLORS.bars.length];
                  const share =
                    snapshot.totalExpenseYTD > 0
                      ? Math.round((row.value / snapshot.totalExpenseYTD) * 100)
                      : 0;
                  const increased = row.delta > 0;
                  const decreased = row.delta < 0;

                  return (
                    <div key={row.name} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-start gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-medium text-foreground min-w-0">
                          <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: color }} />
                          <span className="truncate">{row.name}</span>
                        </span>
                        <span className="font-semibold text-foreground tabular-nums shrink-0 text-right">
                          {share}% · {formatHUF(row.value)}
                        </span>
                      </div>
                      <ProgressBar value={row.value} max={maxCategory} size="md" barStyle={{ backgroundColor: color }} />
                      <p className="text-[0.65rem] text-muted-foreground tabular-nums">
                        {previousYear}: {formatHUF(row.previousValue)}
                        {row.delta !== 0 ? (
                          <span
                            className={classNames(
                              'ml-1.5 font-medium',
                              increased && 'text-rose-600',
                              decreased && 'text-emerald-600',
                            )}
                          >
                            ({increased ? '+' : ''}
                            {formatHUF(row.delta)}
                            {row.deltaPercent !== null ? ` · ${row.deltaPercent > 0 ? '+' : ''}${row.deltaPercent}%` : ''})
                          </span>
                        ) : (
                          <span className="ml-1.5">· változatlan</span>
                        )}
                      </p>
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
