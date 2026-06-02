'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  History,
  PiggyBank,
  Scale,
} from 'lucide-react';
import { formatHUF } from '@/utils';
import { HELP } from '@/config/help';
import { AccentPanel, ProgressBar, SectionPanel } from '@/components/design';
import {
  BUDGET_YEAR_CHART_COLORS,
  type BudgetYearLedgerGroup,
  type BudgetYearSnapshot,
} from '@/calculations/budget-year';

type BudgetYearExtraPanelsProps = {
  selectedYear: number;
  snapshot: BudgetYearSnapshot;
  showDebts: boolean;
  showSavings: boolean;
};

function MiniMonthChart({
  data,
  dataKey,
  color,
  formatter,
}: {
  data: { name: string; [key: string]: string | number }[];
  dataKey: string;
  color: string;
  formatter?: (value: number) => string;
}) {
  if (data.every((row) => Number(row[dataKey] ?? 0) === 0)) {
    return (
      <p className="text-xs text-muted-foreground py-6 text-center">Nincs adat ebben az évben.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.004 250)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'oklch(0.50 0.012 260)' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: 'oklch(0.50 0.012 260)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          width={32}
        />
        <Tooltip
          formatter={(value) => (formatter ? formatter(Number(value)) : formatHUF(Number(value)))}
          contentStyle={{ fontSize: 11 }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BudgetYearIncomePanel({ snapshot, selectedYear }: Pick<BudgetYearExtraPanelsProps, 'snapshot' | 'selectedYear'>) {
  if (snapshot.incomeCategoryRows.length === 0) return null;

  const max = Math.max(...snapshot.incomeCategoryRows.map((row) => row.value));

  return (
    <SectionPanel
      title="Bevétel források"
      description={`${selectedYear} · befolyt bevételek kategóriánként`}
      icon={ArrowUpRight}
      tone="success"
      info={HELP.budget.yearIncomeSources}
      className="shadow-soft"
    >
      <div className="flex flex-col gap-3.5">
        {snapshot.incomeCategoryRows.map((row, index) => {
          const color = BUDGET_YEAR_CHART_COLORS.bars[index % BUDGET_YEAR_CHART_COLORS.bars.length];
          return (
            <div key={row.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-start gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground min-w-0">
                  <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: color }} />
                  <span className="truncate">{row.name}</span>
                </span>
                <span className="font-semibold text-emerald-700 tabular-nums shrink-0">
                  {row.sharePercent}% · {formatHUF(row.value)}
                </span>
              </div>
              <ProgressBar value={row.value} max={max} size="md" barStyle={{ backgroundColor: color }} />
            </div>
          );
        })}
      </div>
    </SectionPanel>
  );
}

export function BudgetYearMissedIncomePanel({
  snapshot,
  selectedYear,
}: Pick<BudgetYearExtraPanelsProps, 'snapshot' | 'selectedYear'>) {
  const missed = snapshot.missedIncome;
  if (!missed) return null;

  return (
    <AccentPanel
      tone="danger"
      icon={AlertTriangle}
      title={`Elmaradt bevétel (${selectedYear}): ${formatHUF(missed.totalMissed)}`}
      description={missed.headlineDescription}
      titleInfo={HELP.budget.yearMissedIncome}
    >
      <div className="flex flex-wrap gap-1.5">
        {missed.byMonth.map((month) => (
          <span
            key={month.month}
            className="inline-flex flex-col gap-0.5 rounded-md bg-card border border-border px-2 py-1.5 text-[0.7rem] shadow-sm min-w-[7rem]"
          >
            <span className="font-medium text-foreground">{month.monthLabel}</span>
            <span className="text-muted-foreground">{month.count} tétel</span>
            <span className="font-semibold tabular-nums text-destructive">{formatHUF(month.amount)}</span>
          </span>
        ))}
      </div>
    </AccentPanel>
  );
}

export function BudgetYearDebtsSavingsPanel({
  snapshot,
  selectedYear,
  showDebts,
  showSavings,
}: BudgetYearExtraPanelsProps) {
  const debts = showDebts ? snapshot.debts : null;
  const savings = showSavings ? snapshot.savings : null;
  if (!debts && !savings) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {debts ? (
        <SectionPanel
          title="Tartozások alakulása"
          description={`${selectedYear} · kifizetett részletek`}
          icon={Scale}
          tone="warning"
          info={HELP.budget.yearDebts}
          className="shadow-soft"
          noPadding
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Kifizetve az évben</p>
                <p className="text-base font-semibold tabular-nums text-foreground">{formatHUF(debts.totalPaidInYear)}</p>
              </div>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Aktuális hátralék</p>
                <p className="text-base font-semibold tabular-nums text-foreground">
                  {formatHUF(debts.totalRemainingNow)}
                </p>
                <p className="text-[0.65rem] text-muted-foreground mt-0.5">{debts.activeDebtsCount} aktív hitel</p>
              </div>
            </div>
            <MiniMonthChart
              data={debts.monthlyChart}
              dataKey="paid"
              color={BUDGET_YEAR_CHART_COLORS.expense}
            />
          </div>
        </SectionPanel>
      ) : null}

      {savings ? (
        <SectionPanel
          title="Megtakarítások mozgása"
          description={`${selectedYear} · befizetések és kivétek`}
          icon={PiggyBank}
          tone="success"
          info={HELP.budget.yearSavings}
          className="shadow-soft"
          noPadding
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Befizetés</p>
                <p className="text-base font-semibold tabular-nums text-emerald-700">
                  +{formatHUF(savings.totalDepositsInYear)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Kivét</p>
                <p className="text-base font-semibold tabular-nums text-rose-600">
                  −{formatHUF(savings.totalWithdrawalsInYear)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 col-span-2 sm:col-span-1">
                <p className="text-muted-foreground">Egyenleg {selectedYear}. végén</p>
                <p className="text-base font-semibold tabular-nums text-foreground">
                  {formatHUF(savings.balanceAtYearEnd)}
                </p>
                <p className="text-[0.65rem] text-muted-foreground mt-0.5">{savings.accountCount} számla</p>
              </div>
            </div>
            <MiniMonthChart
              data={savings.monthlyChart.map((point) => ({
                name: point.name,
                net: Math.max(0, point.net),
              }))}
              dataKey="net"
              color={BUDGET_YEAR_CHART_COLORS.income}
            />
          </div>
        </SectionPanel>
      ) : null}
    </div>
  );
}

function LedgerGroupCard({ group }: { group: BudgetYearLedgerGroup }) {
  const maxMerchant = group.merchants.length > 0 ? group.merchants[0].amount : 0;

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{group.parentDescription}</p>
          <p className="text-[0.65rem] text-muted-foreground">{group.parentCategory}</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-foreground shrink-0">
          {formatHUF(group.totalSpent)}
        </p>
      </div>
      {group.merchants.length === 0 ? (
        <p className="text-xs text-muted-foreground px-4 py-3">Nincs ledger tétel ebben az évben.</p>
      ) : (
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {group.merchants.map((merchant) => (
            <div key={merchant.label} className="flex flex-col gap-1">
              <div className="flex justify-between gap-2 text-xs">
                <span className="font-medium text-foreground truncate" title={merchant.label}>
                  {merchant.label}
                </span>
                <span className="tabular-nums text-muted-foreground shrink-0">
                  {merchant.entryCount}× · {formatHUF(merchant.amount)}
                </span>
              </div>
              <ProgressBar
                value={merchant.amount}
                max={maxMerchant}
                size="sm"
                tone="thresholds"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BudgetYearLedgerPanel({
  snapshot,
  selectedYear,
}: Pick<BudgetYearExtraPanelsProps, 'snapshot' | 'selectedYear'>) {
  if (snapshot.ledgerGroups.length === 0) return null;

  return (
    <SectionPanel
      title="Ledger bontás"
      description={`${selectedYear} · kereten belüli költések (pl. Lidl, Kifli.hu)`}
      icon={History}
      tone="info"
      info={HELP.budget.yearLedger}
      className="shadow-soft"
    >
      <div className="flex flex-col gap-4">
        {snapshot.ledgerGroups.map((group) => (
          <LedgerGroupCard key={group.key} group={group} />
        ))}
      </div>
    </SectionPanel>
  );
}

export function BudgetYearExtraPanels(props: BudgetYearExtraPanelsProps) {
  const hasIncome = props.snapshot.incomeCategoryRows.length > 0;

  return (
    <div className="flex flex-col gap-7">
      {hasIncome ? (
        <BudgetYearIncomePanel snapshot={props.snapshot} selectedYear={props.selectedYear} />
      ) : null}

      <BudgetYearMissedIncomePanel snapshot={props.snapshot} selectedYear={props.selectedYear} />

      <BudgetYearDebtsSavingsPanel {...props} />

      <BudgetYearLedgerPanel snapshot={props.snapshot} selectedYear={props.selectedYear} />
    </div>
  );
}
