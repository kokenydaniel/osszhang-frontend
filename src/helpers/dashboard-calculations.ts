import { formatHUF, compareDates, hasSettlementDate, isDueOverdue } from '@/utils';
import { isUpcomingWithinDays } from '@/helpers/debt-budget';
import { dayjs, formatTodayLong, toDayjs } from '@/utils/dates';
import { utilitiesCalculations } from '@/calculations/utilities';
import { savingsCalculations } from '@/calculations/savings';
import { HELP } from '@/config/help';
import type { MetricItem } from '@/components/design';
import type { Investment, LedgerEntry } from '@/types';
import {
  Wallet,
  TrendingUp,
  Users,
  AlertCircle,
  TrendingDown,
  ReceiptText,
  PiggyBank,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import type {
  DashboardChartPoint,
  DashboardConsumptionItem,
  DashboardInvestmentPayout,
  DashboardSnapshotInput,
  DashboardUnpaidItem,
} from '@/helpers/dashboard-types';
import type { AiCfoContextPayload } from '@/types';

export function dashboardGreeting(): { greeting: string; GreetingIcon: typeof Sun } {
  const hour = dayjs().hour();
  if (hour >= 5 && hour < 12) return { greeting: 'Jó reggelt', GreetingIcon: Sun };
  if (hour >= 12 && hour < 18) return { greeting: 'Jó napot', GreetingIcon: Sun };
  if (hour >= 18 && hour < 21) return { greeting: 'Jó estét', GreetingIcon: Sunset };
  return { greeting: 'Jó éjszakát', GreetingIcon: Moon };
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

function expenseRemaining(tx: import('@/types').CashTransaction): number {
  if (!tx.isBudget) return tx.amount;
  const spent = tx.subItems?.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) ?? 0;
  return Math.max(0, tx.amount - spent);
}

function buildSparkline(
  transactions: DashboardSnapshotInput['transactions'],
  bills: DashboardSnapshotInput['bills'],
  orders: DashboardSnapshotInput['orders'],
  onHouseholdSide: boolean,
  utilitySplitEnabled: boolean,
): { spending: number[]; income: number[]; business: number[] } {
  const spending: number[] = [];
  const income: number[] = [];
  const business: number[] = [];
  const now = dayjs();

  for (let i = 5; i >= 0; i--) {
    const prefix = now.subtract(i, 'month').startOf('month').format('YYYY-MM');
    spending.push(
      transactions
        .filter((t) => t.type === 'expense' && t.dueDate.startsWith(prefix) && t.paidDate)
        .reduce((s, t) => s + t.amount, 0) +
        bills
          .filter((b) => b.dueDate.startsWith(prefix) && b.paidDate)
          .reduce((s, b) => s + utilitiesCalculations.ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled), 0),
    );
    income.push(
      transactions
        .filter((t) => t.type === 'income' && t.dueDate.startsWith(prefix) && t.paidDate)
        .reduce((s, t) => s + t.amount, 0),
    );
    business.push(orders.filter((o) => o.date.startsWith(prefix)).reduce((s, o) => s + o.amount, 0));
  }

  return { spending, income, business };
}

export function computeDashboardSnapshot(input: DashboardSnapshotInput) {
  const prefix = monthPrefix(input.selectedYear, input.selectedMonth);
  const utilityBills = input.bills.filter((b) => !utilitiesCalculations.isLegacySettlementBill(b));
  const monthTransactions = input.transactions.filter((t) => t.dueDate.startsWith(prefix));
  const monthExpenses = monthTransactions.filter((t) => t.type === 'expense');
  const monthBills = utilityBills.filter((b) => b.dueDate.startsWith(prefix));
  const monthSettlement = input.settlements.find(
    (s) => s.year === input.selectedYear && s.month === input.selectedMonth,
  );

  const {
    totalBalance,
    lockedSavings,
    totalPending,
    disposableRemaining,
    overdueTotal,
    monthlyBalance,
    incomeReceived,
    spentThisMonth,
  } = input.cashflow;

  const { netBalance: rawRezsiBalance } = utilitiesCalculations.computeNetBalance(
    monthBills,
    input.user?.id,
    input.partnerId,
    input.utilitySplitEnabled,
  );
  const rezsiBalance = monthSettlement ? 0 : rawRezsiBalance;
  const totalBillsThisMonth = monthBills.reduce((s, b) => s + b.total, 0);
  const externalDebts = input.debts.reduce((s, debt) => s + (debt.targetAmount - debt.paidAmount), 0);
  const totalSavings = lockedSavings;
  const totalInvestmentsValue = input.investments
    .filter((i) => i.countInSavings !== false)
    .reduce((sum, inv) => sum + savingsCalculations.computeInvestmentValue(inv).totalValue, 0);
  const businessTotal = input.orders.filter((o) => o.date.startsWith(prefix)).reduce((s, o) => s + o.amount, 0);
  const todayStr = input.todayStr;
  const overdueUnpaidBills = monthBills.filter((b) => isDueOverdue(b, todayStr));

  const debtInstallmentRows = input.debtInstallments ?? [];

  const unpaidItemsList: DashboardUnpaidItem[] = [
    ...(input.canUse('budget')
      ? monthExpenses.filter((t) => !hasSettlementDate(t.paidDate)).map((t) => ({
          id: t.id,
          type: 'expense' as const,
          description: t.description,
          amount: expenseRemaining(t),
          currency: t.currency,
          dueDate: t.dueDate,
          category: t.category,
        }))
      : []),
    ...(input.canUse('budget')
      ? debtInstallmentRows
          .filter((t) => !hasSettlementDate(t.paidDate))
          .map((t) => ({
            id: t.id,
            type: 'expense' as const,
            description: t.description,
            amount: t.amount,
            currency: t.currency,
            dueDate: t.dueDate,
            category: t.category,
          }))
      : []),
    ...(input.canUse('utilities')
      ? monthBills.filter((b) => !b.paidDate).map((b) => ({
          id: b.id as number,
          type: 'bill' as const,
          description: `${b.type} számla`,
          amount: utilitiesCalculations.ourUtilityPortion(b, input.onHouseholdSide, input.utilitySplitEnabled),
          dueDate: b.dueDate,
          category: 'Rezsi',
        }))
      : []),
  ]
    .filter((item) => isUpcomingWithinDays(item.dueDate, todayStr, 3) || toDayjs(item.dueDate).isBefore(toDayjs(todayStr), 'day'))
    .sort((a, b) => compareDates(a.dueDate, b.dueDate));

  const consumptionData: DashboardConsumptionItem[] = input.meters.map((m) => {
    const reading = m.readings.find((r) => r.month === input.selectedMonth && r.year === input.selectedYear);
    return { id: m.id, name: m.name, location: m.location, value: reading?.consumption || 0, unit: m.unit };
  });

  const sparklines = buildSparkline(
    input.transactions,
    input.bills,
    input.orders,
    input.onHouseholdSide,
    input.utilitySplitEnabled,
  );

  const primaryMetrics: MetricItem[] = [];
  if (input.canUse('budget')) {
    primaryMetrics.push(
      {
        label: 'Egyenleg',
        value: formatHUF(totalBalance),
        info: HELP.dashboard.balance,
        hint: 'Jelenlegi keret',
        icon: Wallet,
        tone: 'primary',
        emphasis: true,
        sparkline: sparklines.income.length > 1 ? sparklines.income : undefined,
      },
      {
        label: 'Fizetendő',
        value: formatHUF(totalPending),
        info: HELP.dashboard.payable,
        hint: unpaidItemsList.length > 0 ? `${unpaidItemsList.length} tétel` : 'Minden rendezve',
        icon: ReceiptText,
        tone: totalPending > 0 ? 'warning' : 'success',
        sparkline: sparklines.spending.length > 1 ? sparklines.spending : undefined,
      },
      {
        label: 'Marad',
        value: formatHUF(disposableRemaining),
        info: HELP.dashboard.remaining,
        hint: 'Egyenleg − fizetendő',
        icon: TrendingUp,
        tone: disposableRemaining >= 0 ? 'success' : 'danger',
      },
      {
        label: 'Lejárt',
        value: formatHUF(overdueTotal),
        info: HELP.dashboard.overdue,
        hint: overdueTotal > 0 ? 'Sürgős!' : 'Nincs lejárt',
        icon: AlertCircle,
        tone: overdueTotal > 0 ? 'danger' : 'default',
      },
    );
  }

  const secondaryMetrics: MetricItem[] = [];
  if (input.canUse('savings')) {
    secondaryMetrics.push({
      label: 'Vagyon',
      value: formatHUF(totalSavings),
      info: HELP.dashboard.wealth,
      hint: 'Számlák és állampapírok',
      icon: PiggyBank,
      tone: 'primary',
      emphasis: true,
    });
  }
  if (input.businessEnabled) {
    secondaryMetrics.push({
      label: input.businessName,
      value: formatHUF(businessTotal),
      info: HELP.dashboard.business,
      hint: 'Tárgyhavi árbevétel',
      icon: TrendingUp,
      tone: 'info',
      sparkline: sparklines.business.length > 1 ? sparklines.business : undefined,
    });
  }
  if (input.canUse('utilities')) {
    secondaryMetrics.push({
      label: input.utilitySplitEnabled ? 'Rezsi mérleg' : 'Havi rezsi',
      value: input.utilitySplitEnabled
        ? `${rezsiBalance >= 0 ? '+' : ''}${formatHUF(rezsiBalance)}`
        : formatHUF(totalBillsThisMonth),
      info: HELP.dashboard.utilities,
      hint: input.utilitySplitEnabled
        ? rezsiBalance > 0
          ? `${input.counterpartyLabel} tartozik`
          : rezsiBalance < 0
            ? 'Te tartozol'
            : 'Rendezve'
        : 'Közüzemi számlák',
      icon: Users,
      tone: input.utilitySplitEnabled
        ? rezsiBalance < 0
          ? 'danger'
          : rezsiBalance > 0
            ? 'success'
            : 'default'
        : 'default',
    });
  }
  if (input.canUse('debts')) {
    secondaryMetrics.push({
      label: 'Tartozások',
      value: formatHUF(externalDebts),
      info: HELP.dashboard.debts,
      hint: 'Hitelek és kölcsönök',
      icon: TrendingDown,
      tone: externalDebts > 0 ? 'warning' : 'success',
    });
  }

  const chartData: DashboardChartPoint[] = Object.entries(
    input.orders.reduce(
      (acc, o) => {
        const k = o.date.substring(0, 7);
        acc[k] = (acc[k] || 0) + o.amount;
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, v]) => ({ name: k.replace('-', '.'), amount: v }));

  const investmentPayouts: DashboardInvestmentPayout[] = input.investments
    .map((inv) => {
      const payout = savingsCalculations.estimateNextInvestmentPayout(inv);
      if (!payout) return null;
      return { invName: inv.name, owner: inv.owner, ...payout };
    })
    .filter((p): p is DashboardInvestmentPayout => p !== null)
    .sort((a, b) => (!a.date ? 1 : !b.date ? -1 : compareDates(a.date, b.date)));

  const totalUpcomingPayouts = investmentPayouts.reduce((sum, payout) => sum + payout.amount, 0);

  const topSpendingCategories = Object.entries(
    monthExpenses.reduce(
      (acc, tx) => {
        const category = tx.category || 'Egyéb';
        acc[category] = (acc[category] || 0) + tx.amount;
        return acc;
      },
      {} as Record<string, number>,
    ),
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }));

  const savingsGoals = input.savings
    .filter((acc) => acc.type === 'goal')
    .map((goal) => {
      const current = goal.ledger.reduce((sum, entry) => sum + entry.amount, 0);
      const target = goal.goalAmount ?? 0;
      return {
        title: goal.institution,
        target_amount: Math.round(target),
        current_amount: Math.round(current),
        remaining_amount: Math.round(Math.max(0, target - current)),
        target_date: goal.targetDate,
      };
    });

  const debtsBreakdown = input.debts
    .map((debt) => ({
      name: debt.name,
      remaining: Math.round(Math.max(0, debt.targetAmount - debt.paidAmount)),
    }))
    .filter((debt) => debt.remaining > 0);

  return {
    monthlyBalance,
    isOverspentThisMonth: monthlyBalance < 0,
    overdueUnpaidBills,
    rezsiBalance,
    primaryMetrics,
    secondaryMetrics,
    unpaidItemsList,
    exchangeRates: input.exchangeRates,
    monthBills,
    consumptionData,
    investmentPayouts,
    totalUpcomingPayouts,
    totalInvestmentsValue,
    chartData,
    aiCfoContext: {
      year: input.selectedYear,
      month: input.selectedMonth,
      wallet_id: 0,
      total_balance: totalBalance,
      locked_savings: lockedSavings,
      total_pending: totalPending,
      disposable_remaining: disposableRemaining,
      overdue_total: overdueTotal,
      income_received: incomeReceived,
      spent_this_month: spentThisMonth,
      monthly_balance: monthlyBalance,
      total_debts: Math.round(externalDebts),
      top_spending_categories: topSpendingCategories,
      savings_goals: savingsGoals,
      debts: debtsBreakdown,
    },
  };
}

export { formatTodayLong as dashboardTodayFormatted };
