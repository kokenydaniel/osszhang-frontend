import type { CashTransaction, SavingsAccount, UtilityBill } from '@/types';
import type { Debt } from '@/types/debts';
import { hasSettlementDate } from '@/utils';
import { formatHUF, shortMonthName } from '@/utils';
import { HELP } from '@/config/help';
import { budgetCalculations } from '@/calculations/budget';
import { toHuf } from '@/utils/money';
import {
  budgetYearExtendedCalculations,
  type BudgetYearDebtsSummary,
  type BudgetYearExtended,
  type BudgetYearIncomeCategoryRow,
  type BudgetYearLedgerGroup,
  type BudgetYearMissedIncome,
  type BudgetYearSavingsSummary,
} from '@/calculations/budget-year-extended';
import { utilitiesCalculations } from '@/calculations/utilities';
import { buildDebtBudgetExpenses } from '@/helpers/debt-budget';
import { buildInsuranceBudgetExpenses } from '@/helpers/insurance-budget';
import type { InsurancePolicy } from '@/types/insurance';
import type { MetricItem } from '@/components/design';
import { ArrowDownRight, ArrowUpRight, Minus, Tag, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

export type {
  BudgetYearDebtsSummary,
  BudgetYearIncomeCategoryRow,
  BudgetYearLedgerGroup,
  BudgetYearMissedIncome,
  BudgetYearSavingsSummary,
};

export type BudgetYearMonthlyPoint = {
  name: string;
  kiadas: number;
  bevetel: number;
};

export type BudgetYearCategoryRow = {
  name: string;
  value: number;
  previousValue: number;
  delta: number;
  deltaPercent: number | null;
};

export type BudgetYearSnapshot = {
  totalExpenseYTD: number;
  totalIncomeYTD: number;
  netYTD: number;
  totalExpensePreviousYear: number;
  yearOverYearDelta: number;
  yearOverYearPercent: number | null;
  topCategory: string;
  categoryRows: BudgetYearCategoryRow[];
  monthlyChart: BudgetYearMonthlyPoint[];
} & BudgetYearExtended;

export type BudgetYearInsight = {
  title: string;
  value: string;
  hint: string;
  tone: 'default' | 'success' | 'warning' | 'danger' | 'primary';
};

function yearPrefix(year: number): string {
  return String(year);
}

function inYear(dueDate: string, year: number): boolean {
  return dueDate.startsWith(yearPrefix(year));
}

export function incomeReceivedAmount(tx: CashTransaction, rates: Record<string, number>): number {
  if (tx.type !== 'income' || tx.isReserve) return 0;
  if (!hasSettlementDate(tx.paidDate)) return 0;
  return toHuf(tx.amount, tx.currency, rates);
}

function debtInstallmentsForYear(
  debts: Debt[],
  year: number,
  categories: string[],
  categoryPattern: string,
): CashTransaction[] {
  const rows: CashTransaction[] = [];
  for (let month = 1; month <= 12; month += 1) {
    rows.push(...buildDebtBudgetExpenses(debts, year, month, categories, categoryPattern));
  }
  return rows;
}

function insurancePremiumsForYear(
  policies: InsurancePolicy[],
  year: number,
  categories: string[],
  categoryPattern: string,
): CashTransaction[] {
  const rows: CashTransaction[] = [];
  for (let month = 1; month <= 12; month += 1) {
    rows.push(...buildInsuranceBudgetExpenses(policies, year, month, categories, categoryPattern));
  }
  return rows;
}

function sumCategorySpent(
  transactions: CashTransaction[],
  goalRows: CashTransaction[],
  bills: UtilityBill[],
  debtRows: CashTransaction[],
  categories: string[],
  getBillPortion: (b: UtilityBill) => number,
  rates: Record<string, number>,
): Map<string, number> {
  const totals = new Map<string, number>();

  const add = (category: string, amount: number) => {
    if (amount <= 0) return;
    const key = category || 'Egyéb';
    totals.set(key, (totals.get(key) ?? 0) + amount);
  };

  for (const tx of [...transactions, ...goalRows]) {
    if (tx.type !== 'expense' || tx.isReserve) continue;
    add(tx.category || 'Egyéb', budgetCalculations.categorySummaryAmount(tx, rates));
  }

  for (const bill of bills) {
    add('Rezsi', getBillPortion(bill));
  }

  for (const row of debtRows) {
    add(row.category || 'Egyéb', budgetCalculations.categorySummaryAmount(row, rates));
  }

  for (const name of categories) {
    if (!totals.has(name)) totals.set(name, 0);
  }

  return totals;
}

function mapToCategoryRows(
  current: Map<string, number>,
  previous: Map<string, number>,
): BudgetYearCategoryRow[] {
  const names = new Set([...current.keys(), ...previous.keys()]);
  return [...names]
    .map((name) => {
      const value = current.get(name) ?? 0;
      const previousValue = previous.get(name) ?? 0;
      const delta = value - previousValue;
      const deltaPercent =
        previousValue > 0 ? Math.round((delta / previousValue) * 1000) / 10 : value > 0 ? null : 0;
      return { name, value, previousValue, delta, deltaPercent };
    })
    .filter((row) => row.value > 0 || row.previousValue > 0)
    .sort((a, b) => b.value - a.value);
}

export const budgetYearCalculations = {
  filterTransactionsForYear(transactions: CashTransaction[], year: number): CashTransaction[] {
    return transactions.filter((tx) => inYear(tx.dueDate, year));
  },

  filterBillsForYear(bills: UtilityBill[], year: number): UtilityBill[] {
    return bills.filter(
      (bill) => inYear(bill.dueDate, year) && !utilitiesCalculations.isLegacySettlementBill(bill),
    );
  },

  computeYearSnapshot(params: {
    transactions: CashTransaction[];
    goalRows: CashTransaction[];
    bills: UtilityBill[];
    debts: Debt[];
    insurancePolicies?: InsurancePolicy[];
    insuranceCategoryPattern?: string;
    savings: SavingsAccount[];
    year: number;
    categories: string[];
    debtCategoryPattern: string;
    getBillPortion: (b: UtilityBill) => number;
    includeDebts: boolean;
    includeInsurance?: boolean;
    includeSavings: boolean;
    exchangeRates?: Record<string, number>;
  }): BudgetYearSnapshot {
    const {
      transactions,
      goalRows,
      bills,
      debts,
      insurancePolicies = [],
      insuranceCategoryPattern = 'biztosít',
      savings,
      year,
      categories,
      debtCategoryPattern,
      getBillPortion,
      includeDebts,
      includeInsurance = false,
      includeSavings,
    } = params;
    const rates = params.exchangeRates ?? { HUF: 1 };
    const previousYear = year - 1;

    const yearTx = this.filterTransactionsForYear(transactions, year);
    const prevYearTx = this.filterTransactionsForYear(transactions, previousYear);
    const yearBills = this.filterBillsForYear(bills, year);
    const prevYearBills = this.filterBillsForYear(bills, previousYear);
    const yearDebtRows = [
      ...(includeDebts ? debtInstallmentsForYear(debts, year, categories, debtCategoryPattern) : []),
      ...(includeInsurance
        ? insurancePremiumsForYear(insurancePolicies, year, categories, insuranceCategoryPattern)
        : []),
    ];
    const prevDebtRows = [
      ...(includeDebts ? debtInstallmentsForYear(debts, previousYear, categories, debtCategoryPattern) : []),
      ...(includeInsurance
        ? insurancePremiumsForYear(insurancePolicies, previousYear, categories, insuranceCategoryPattern)
        : []),
    ];

    const yearGoals = goalRows.filter((row) => inYear(row.dueDate, year));
    const prevYearGoals = goalRows.filter((row) => inYear(row.dueDate, previousYear));

    const currentCategories = sumCategorySpent(
      yearTx,
      yearGoals,
      yearBills,
      yearDebtRows,
      categories,
      getBillPortion,
      rates,
    );
    const previousCategories = sumCategorySpent(
      prevYearTx,
      prevYearGoals,
      prevYearBills,
      prevDebtRows,
      categories,
      getBillPortion,
      rates,
    );

    const totalExpenseYTD = [...currentCategories.values()].reduce((sum, value) => sum + value, 0);
    const totalExpensePreviousYear = [...previousCategories.values()].reduce((sum, value) => sum + value, 0);
    const yearOverYearDelta = totalExpenseYTD - totalExpensePreviousYear;
    const yearOverYearPercent =
      totalExpensePreviousYear > 0
        ? Math.round((yearOverYearDelta / totalExpensePreviousYear) * 1000) / 10
        : totalExpenseYTD > 0
          ? null
          : 0;

    const totalIncomeYTD = yearTx.reduce((sum, tx) => sum + incomeReceivedAmount(tx, rates), 0);
    const categoryRows = mapToCategoryRows(currentCategories, previousCategories);
    const topCategory = categoryRows[0]?.name ?? '—';

    const monthlyChart: BudgetYearMonthlyPoint[] = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const prefix = `${year}-${month.toString().padStart(2, '0')}`;
      const monthTx = yearTx.filter((tx) => tx.dueDate.startsWith(prefix));
      const monthGoals = yearGoals.filter((row) => row.dueDate.startsWith(prefix));
      const monthBills = yearBills.filter((bill) => bill.dueDate.startsWith(prefix));
      const monthDebt = yearDebtRows.filter((row) => row.dueDate.startsWith(prefix));

      const kiadas =
        [...monthTx, ...monthGoals].reduce(
          (sum, tx) => sum + budgetCalculations.categorySummaryAmount(tx, rates),
          0,
        ) +
        monthBills.reduce((sum, bill) => sum + getBillPortion(bill), 0) +
        monthDebt.reduce((sum, row) => sum + budgetCalculations.categorySummaryAmount(row, rates), 0);

      const bevetel = monthTx.reduce((sum, tx) => sum + incomeReceivedAmount(tx, rates), 0);

      return { name: shortMonthName(month), kiadas, bevetel };
    });

    const extended = budgetYearExtendedCalculations.computeExtended({
      transactions,
      year,
      debts,
      savings,
      categories,
      debtCategoryPattern,
      includeDebts,
      includeSavings,
    });

    return {
      totalExpenseYTD,
      totalIncomeYTD,
      netYTD: totalIncomeYTD - totalExpenseYTD,
      totalExpensePreviousYear,
      yearOverYearDelta,
      yearOverYearPercent,
      topCategory,
      categoryRows,
      monthlyChart,
      ...extended,
    };
  },

  buildYearMetrics(snapshot: BudgetYearSnapshot, year: number): MetricItem[] {
    const sparkline = snapshot.monthlyChart.map((point) => point.kiadas);
    const yoyHint =
      snapshot.yearOverYearPercent === null
        ? snapshot.yearOverYearDelta === 0
          ? 'Az előző évhez hasonló'
          : `${snapshot.yearOverYearDelta > 0 ? '+' : ''}${formatHUF(snapshot.yearOverYearDelta)} vs ${year - 1}`
        : `${snapshot.yearOverYearPercent > 0 ? '+' : ''}${snapshot.yearOverYearPercent}% vs ${year - 1}`;

    return [
      {
        label: 'Éves kiadás',
        value: formatHUF(snapshot.totalExpenseYTD),
        info: HELP.budget.yearExpense,
        hint: `${year} · kifizetett tételek`,
        icon: TrendingDown,
        tone: 'warning',
        emphasis: true,
        sparkline: sparkline.length > 1 ? sparkline : undefined,
      },
      {
        label: 'Éves bevétel',
        value: formatHUF(snapshot.totalIncomeYTD),
        info: HELP.budget.yearIncome,
        hint: 'Befolyt összeg',
        icon: TrendingUp,
        tone: 'success',
        sparkline: snapshot.monthlyChart.map((point) => point.bevetel),
      },
      {
        label: 'Nettó',
        value: formatHUF(snapshot.netYTD),
        info: HELP.budget.yearNet,
        hint: 'Bevétel − kiadás',
        icon: Wallet,
        tone: snapshot.netYTD >= 0 ? 'success' : 'danger',
      },
      {
        label: 'Előző évhez',
        value:
          snapshot.yearOverYearPercent === null
            ? formatHUF(snapshot.yearOverYearDelta)
            : `${snapshot.yearOverYearPercent > 0 ? '+' : ''}${snapshot.yearOverYearPercent}%`,
        info: HELP.budget.yearComparison,
        hint: yoyHint,
        icon: snapshot.yearOverYearDelta > 0 ? ArrowUpRight : snapshot.yearOverYearDelta < 0 ? ArrowDownRight : Minus,
        tone:
          snapshot.yearOverYearDelta > 0 ? 'danger' : snapshot.yearOverYearDelta < 0 ? 'success' : 'default',
      },
    ];
  },

  buildTopCategoryMetric(snapshot: BudgetYearSnapshot): MetricItem {
    return {
      label: 'Top kategória',
      value: snapshot.topCategory,
      info: HELP.budget.yearTopCategory,
      hint: 'Legnagyobb kiadás',
      icon: Tag,
      tone: 'primary',
    };
  },

  buildYearInsights(snapshot: BudgetYearSnapshot, year: number): BudgetYearInsight[] {
    const activeMonths = snapshot.monthlyChart.filter((m) => m.kiadas > 0 || m.bevetel > 0);
    const monthCount = activeMonths.length || 1;
    const avgMonthlyExpense = Math.round(snapshot.totalExpenseYTD / monthCount);
    const peakMonth = snapshot.monthlyChart.reduce(
      (best, point) => (point.kiadas > best.kiadas ? point : best),
      snapshot.monthlyChart[0],
    );
    const surplusMonths = snapshot.monthlyChart.filter((m) => m.bevetel > m.kiadas).length;
    const deficitMonths = snapshot.monthlyChart.filter((m) => m.kiadas > m.bevetel && m.kiadas > 0).length;
    const savingsRate =
      snapshot.totalIncomeYTD > 0
        ? Math.round((snapshot.netYTD / snapshot.totalIncomeYTD) * 1000) / 10
        : null;
    const rezsiRow = snapshot.categoryRows.find((row) => row.name === 'Rezsi');
    const rezsiShare =
      snapshot.totalExpenseYTD > 0 && rezsiRow
        ? Math.round((rezsiRow.value / snapshot.totalExpenseYTD) * 100)
        : null;
    const fastestGrowing = [...snapshot.categoryRows]
      .filter((row) => row.delta > 0 && row.previousValue > 0)
      .sort((a, b) => (b.deltaPercent ?? 0) - (a.deltaPercent ?? 0))[0];

    const insights: BudgetYearInsight[] = [
      {
        title: 'Átlagos havi kiadás',
        value: formatHUF(avgMonthlyExpense),
        hint: `${monthCount} aktív hónap alapján`,
        tone: 'default',
      },
      {
        title: 'Legdrágább hónap',
        value: peakMonth?.name ?? '—',
        hint: peakMonth ? formatHUF(peakMonth.kiadas) : 'Nincs adat',
        tone: 'warning',
      },
      {
        title: 'Pluszos hónapok',
        value: `${surplusMonths} / 12`,
        hint: 'Bevétel meghaladta a kiadást',
        tone: surplusMonths >= 6 ? 'success' : surplusMonths > 0 ? 'primary' : 'danger',
      },
    ];

    if (savingsRate !== null) {
      insights.push({
        title: 'Megtakarítási arány',
        value: `${savingsRate > 0 ? '+' : ''}${savingsRate}%`,
        hint: 'Nettó / éves bevétel',
        tone: savingsRate >= 10 ? 'success' : savingsRate >= 0 ? 'primary' : 'danger',
      });
    }

    if (rezsiShare !== null) {
      insights.push({
        title: 'Rezsi arány',
        value: `${rezsiShare}%`,
        hint: 'Az éves kifizetett kiadásból',
        tone: rezsiShare > 35 ? 'warning' : 'default',
      });
    }

    if (fastestGrowing) {
      insights.push({
        title: 'Legnagyobb növekedés',
        value: fastestGrowing.name,
        hint: `+${fastestGrowing.deltaPercent ?? 0}% vs ${year - 1}`,
        tone: 'danger',
      });
    }

    if (deficitMonths > 0 && snapshot.totalIncomeYTD > 0) {
      insights.push({
        title: 'Deficit hónapok',
        value: String(deficitMonths),
        hint: 'Kiadás volt nagyobb, mint a bevétel',
        tone: deficitMonths > 4 ? 'danger' : 'warning',
      });
    }

    return insights.slice(0, 6);
  },

  buildFallbackYearAdvice(snapshot: BudgetYearSnapshot, year: number): string {
    const parts: string[] = [];
    if (snapshot.totalExpenseYTD <= 0 && snapshot.totalIncomeYTD <= 0) {
      return 'Még nincs elég kifizetett tétel az éves összesítéshez. Amint rögzítesz bevételeket és kiadásokat, itt megjelenik a tanulság.';
    }
    if (snapshot.netYTD >= 0) {
      parts.push(`${year}-ben eddig ${formatHUF(snapshot.netYTD)} nettó pozitív egyenleged van.`);
    } else {
      parts.push(
        `${year}-ben eddig ${formatHUF(Math.abs(snapshot.netYTD))} nettó hiányod van — érdemes átnézni a legnagyobb kategóriákat.`,
      );
    }
    if (snapshot.topCategory !== '—') {
      parts.push(`A legtöbb pénz a „${snapshot.topCategory}” kategóriába ment.`);
    }
    if (snapshot.yearOverYearDelta > 0 && snapshot.yearOverYearPercent !== null) {
      parts.push(
        `Az előző évhez képest ${snapshot.yearOverYearPercent}% kal emelkedett a kifizetett kiadás — figyeld a legjobban növekvő sorokat.`,
      );
    } else if (snapshot.yearOverYearDelta < 0 && snapshot.yearOverYearPercent !== null) {
      parts.push(
        `Az előző évhez képest ${Math.abs(snapshot.yearOverYearPercent)}%-kal csökkent a kifizetett kiadás — jó irány.`,
      );
    }
    return parts.join(' ');
  },

  buildYearReviewPrompt(snapshot: BudgetYearSnapshot, year: number): string {
    const categories = snapshot.categoryRows
      .slice(0, 8)
      .map((row) => `${row.name}: ${formatHUF(row.value)} (${row.delta >= 0 ? '+' : ''}${formatHUF(row.delta)} vs előző év)`)
      .join('; ');
    const months = snapshot.monthlyChart
      .filter((m) => m.kiadas > 0 || m.bevetel > 0)
      .map((m) => `${m.name}: kiadás ${formatHUF(m.kiadas)}, bevétel ${formatHUF(m.bevetel)}`)
      .join('; ');

    return `Elemezd a háztartás ${year}. évi pénzügyi helyzetét, és adj 3–4 mondatos, konkrét tanácsot magyarul.

Adataim (kifizetett tételek alapján):
- Éves kiadás: ${formatHUF(snapshot.totalExpenseYTD)}
- Éves bevétel: ${formatHUF(snapshot.totalIncomeYTD)}
- Nettó: ${formatHUF(snapshot.netYTD)}
- Előző év kiadása: ${formatHUF(snapshot.totalExpensePreviousYear)}
- Top kategória: ${snapshot.topCategory}
- Kategóriák: ${categories || 'nincs'}
- Havi bontás: ${months || 'nincs'}`;
  },
};

export const BUDGET_YEAR_CHART_COLORS = {
  expense: 'oklch(0.62 0.22 25)',
  income: 'oklch(0.65 0.18 150)',
  bars: ['oklch(0.55 0.22 275)', 'oklch(0.62 0.22 25)', 'oklch(0.72 0.16 60)', 'oklch(0.65 0.18 150)'] as const,
};
