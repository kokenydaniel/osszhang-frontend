import type { CashTransaction, LedgerEntry, SavingsAccount } from '@/types';
import type { Debt } from '@/types/debts';
import { budgetIncomeCalculations } from '@/calculations/budget-income';
import { debtsCalculations } from '@/calculations/debts';
import { hasSettlementDate, shortMonthName } from '@/utils';
import { today, toDayjs } from '@/utils/dates';
import { buildDebtBudgetExpenses } from '@/helpers/debt-budget';

export type BudgetYearIncomeCategoryRow = {
  name: string;
  value: number;
  sharePercent: number;
};

export type BudgetYearMissedIncome = {
  totalMissed: number;
  itemCount: number;
  headlineDescription: string;
  byMonth: { month: number; monthLabel: string; amount: number; count: number }[];
};

export type BudgetYearMonthlyDebtPoint = {
  name: string;
  paid: number;
  planned: number;
};

export type BudgetYearDebtsSummary = {
  totalPaidInYear: number;
  totalRemainingNow: number;
  activeDebtsCount: number;
  monthlyChart: BudgetYearMonthlyDebtPoint[];
};

export type BudgetYearMonthlySavingsPoint = {
  name: string;
  deposits: number;
  withdrawals: number;
  net: number;
};

export type BudgetYearSavingsSummary = {
  totalDepositsInYear: number;
  totalWithdrawalsInYear: number;
  netInYear: number;
  balanceAtYearEnd: number;
  monthlyChart: BudgetYearMonthlySavingsPoint[];
  accountCount: number;
};

export type BudgetYearLedgerMerchantRow = {
  label: string;
  amount: number;
  entryCount: number;
};

export type BudgetYearLedgerGroup = {
  key: string;
  parentDescription: string;
  parentCategory: string;
  totalSpent: number;
  merchants: BudgetYearLedgerMerchantRow[];
};

export type BudgetYearExtended = {
  incomeCategoryRows: BudgetYearIncomeCategoryRow[];
  missedIncome: BudgetYearMissedIncome | null;
  debts: BudgetYearDebtsSummary | null;
  savings: BudgetYearSavingsSummary | null;
  ledgerGroups: BudgetYearLedgerGroup[];
};

function inYear(dateStr: string, year: number): boolean {
  return dateStr.startsWith(String(year));
}

function throughMonthForYear(year: number): number {
  const now = toDayjs(today());
  if (year < now.year()) return 12;
  if (year > now.year()) return 0;
  return now.month() + 1;
}

function sumIncomeByCategory(yearTx: CashTransaction[]): BudgetYearIncomeCategoryRow[] {
  const totals = new Map<string, number>();
  for (const tx of yearTx) {
    if (tx.type !== 'income' || tx.isReserve) continue;
    if (!hasSettlementDate(tx.paidDate)) continue;
    const key = tx.category?.trim() || 'Egyéb';
    totals.set(key, (totals.get(key) ?? 0) + tx.amount);
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  return [...totals.entries()]
    .map(([name, value]) => ({
      name,
      value,
      sharePercent: Math.round((value / total) * 1000) / 10,
    }))
    .sort((a, b) => b.value - a.value);
}

function buildMissedIncomeYear(transactions: CashTransaction[], year: number): BudgetYearMissedIncome | null {
  const throughMonth = throughMonthForYear(year);
  if (throughMonth < 1) return null;

  const summary = budgetIncomeCalculations.computeMissedIncomeSummary({
    transactions,
    selectedYear: year,
    throughMonth,
  });
  if (!summary) return null;

  const byMonthMap = new Map<number, { amount: number; count: number }>();
  for (const item of summary.items) {
    const prev = byMonthMap.get(item.month) ?? { amount: 0, count: 0 };
    byMonthMap.set(item.month, {
      amount: prev.amount + item.amount,
      count: prev.count + 1,
    });
  }

  const byMonth = [...byMonthMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([month, data]) => ({
      month,
      monthLabel: toDayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY. MMMM'),
      amount: data.amount,
      count: data.count,
    }));

  return {
    totalMissed: summary.totalMissed,
    itemCount: summary.itemCount,
    headlineDescription: summary.headlineDescription,
    byMonth,
  };
}

function buildDebtsSummary(
  debts: Debt[],
  year: number,
  categories: string[],
  categoryPattern: string,
): BudgetYearDebtsSummary | null {
  if (debts.length === 0) return null;

  const monthlyChart: BudgetYearMonthlyDebtPoint[] = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const rows = buildDebtBudgetExpenses(debts, year, month, categories, categoryPattern);
    const paid = rows
      .filter((row) => hasSettlementDate(row.paidDate))
      .reduce((sum, row) => sum + row.amount, 0);
    const planned = rows.reduce((sum, row) => sum + row.amount, 0);
    return { name: shortMonthName(month), paid, planned };
  });

  const totalPaidInYear = monthlyChart.reduce((sum, point) => sum + point.paid, 0);
  const activeDebts = debts.filter((debt) => debtsCalculations.remaining(debt) > 0);
  const totalRemainingNow = activeDebts.reduce((sum, debt) => sum + debtsCalculations.remaining(debt), 0);

  if (totalPaidInYear <= 0 && totalRemainingNow <= 0 && activeDebts.length === 0) {
    return null;
  }

  return {
    totalPaidInYear,
    totalRemainingNow,
    activeDebtsCount: activeDebts.length,
    monthlyChart,
  };
}

function filterSavingsForWallet(savings: SavingsAccount[], walletId: number | null): SavingsAccount[] {
  if (walletId === null) return savings;
  return savings.filter((account) => account.walletId === null || account.walletId === walletId);
}

function ledgerBalanceAtYearEnd(account: SavingsAccount, year: number): number {
  const yearEnd = toDayjs(`${year}-12-31`);
  return account.ledger
    .filter((entry) => {
      const d = toDayjs(entry.date);
      return d.isValid() && !d.isAfter(yearEnd, 'day');
    })
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function buildSavingsSummary(savings: SavingsAccount[], year: number): BudgetYearSavingsSummary | null {
  const accounts = savings.filter((account) => account.count_in_savings !== false);
  if (accounts.length === 0) return null;

  const monthlyChart: BudgetYearMonthlySavingsPoint[] = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    let deposits = 0;
    let withdrawals = 0;

    for (const account of accounts) {
      for (const entry of account.ledger) {
        if (!entry.date.startsWith(prefix)) continue;
        if (entry.amount >= 0) deposits += entry.amount;
        else withdrawals += Math.abs(entry.amount);
      }
    }

    return {
      name: shortMonthName(month),
      deposits: Math.round(deposits),
      withdrawals: Math.round(withdrawals),
      net: Math.round(deposits - withdrawals),
    };
  });

  const totalDepositsInYear = monthlyChart.reduce((sum, point) => sum + point.deposits, 0);
  const totalWithdrawalsInYear = monthlyChart.reduce((sum, point) => sum + point.withdrawals, 0);
  const balanceAtYearEnd = accounts.reduce(
    (sum, account) => sum + Math.max(0, ledgerBalanceAtYearEnd(account, year)),
    0,
  );

  if (totalDepositsInYear <= 0 && totalWithdrawalsInYear <= 0 && balanceAtYearEnd <= 0) {
    return null;
  }

  return {
    totalDepositsInYear,
    totalWithdrawalsInYear,
    netInYear: totalDepositsInYear - totalWithdrawalsInYear,
    balanceAtYearEnd: Math.round(balanceAtYearEnd),
    monthlyChart,
    accountCount: accounts.length,
  };
}

function merchantKey(reason: string): string {
  return reason.trim().toLowerCase() || 'névtelen';
}

function parentLedgerKey(tx: CashTransaction): string {
  return `${tx.category || 'Egyéb'}::${tx.description.trim().toLowerCase() || 'keret'}`;
}

function entryInYear(entry: LedgerEntry, year: number): boolean {
  return inYear(entry.date.slice(0, 10), year);
}

function buildLedgerGroups(yearTx: CashTransaction[], year: number): BudgetYearLedgerGroup[] {
  const groups = new Map<
    string,
    {
      parentDescription: string;
      parentCategory: string;
      totalSpent: number;
      merchants: Map<string, { label: string; amount: number; entryCount: number }>;
    }
  >();

  for (const tx of yearTx) {
    if (tx.type !== 'expense' || !tx.isBudget) continue;
    const items = tx.subItems ?? [];
    if (items.length === 0) continue;

    const key = parentLedgerKey(tx);
    if (!groups.has(key)) {
      groups.set(key, {
        parentDescription: tx.description.trim() || 'Saját keret',
        parentCategory: tx.category || 'Egyéb',
        totalSpent: 0,
        merchants: new Map(),
      });
    }
    const group = groups.get(key)!;

    for (const entry of items) {
      if (!entryInYear(entry, year)) continue;
      const amount = Math.abs(entry.amount);
      if (amount <= 0) continue;
      group.totalSpent += amount;

      const mKey = merchantKey(entry.reason);
      const prev = group.merchants.get(mKey);
      const displayLabel = entry.reason.trim() || 'Névtelen';
      group.merchants.set(mKey, {
        label: prev?.label ?? displayLabel,
        amount: (prev?.amount ?? 0) + amount,
        entryCount: (prev?.entryCount ?? 0) + 1,
      });
    }
  }

  return [...groups.values()]
    .filter((group) => group.totalSpent > 0)
    .map((group) => ({
      key: `${group.parentCategory}::${group.parentDescription}`,
      parentDescription: group.parentDescription,
      parentCategory: group.parentCategory,
      totalSpent: Math.round(group.totalSpent),
      merchants: [...group.merchants.values()]
        .map((row) => ({
          label: row.label,
          amount: Math.round(row.amount),
          entryCount: row.entryCount,
        }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

export const budgetYearExtendedCalculations = {
  computeExtended(params: {
    transactions: CashTransaction[];
    year: number;
    debts: Debt[];
    savings: SavingsAccount[];
    categories: string[];
    debtCategoryPattern: string;
    includeDebts: boolean;
    includeSavings: boolean;
  }): BudgetYearExtended {
    const {
      transactions,
      year,
      debts,
      savings,
      categories,
      debtCategoryPattern,
      includeDebts,
      includeSavings,
    } = params;

    const yearTx = transactions.filter((tx) => inYear(tx.dueDate, year));

    return {
      incomeCategoryRows: sumIncomeByCategory(yearTx),
      missedIncome: buildMissedIncomeYear(transactions, year),
      debts: includeDebts
        ? buildDebtsSummary(debts, year, categories, debtCategoryPattern)
        : null,
      savings: includeSavings ? buildSavingsSummary(savings, year) : null,
      ledgerGroups: buildLedgerGroups(yearTx, year),
    };
  },
};
