'use client';

import { useMemo } from 'react';
import { budgetCalculations, type BudgetCashflowMetrics } from '@/calculations/budget';
import { utilitiesCalculations } from '@/calculations/utilities';
import type { CashTransaction, UtilityBill } from '@/types';

export function useBudgetCashflowMetrics(params: {
  manualBalance: number;
  transactions: CashTransaction[];
  goalBudgetRows: CashTransaction[];
  goalsReady: boolean;
  bills: UtilityBill[];
  selectedMonth: number;
  selectedYear: number;
  onHouseholdSide: boolean;
  utilitySplitEnabled: boolean;
  includeBudgetExpenses?: boolean;
  includeUtilityBills?: boolean;
  includeGoalRows?: boolean;
  extraMonthExpenses?: CashTransaction[];
}): BudgetCashflowMetrics {
  const {
    manualBalance,
    transactions,
    goalBudgetRows,
    goalsReady,
    bills,
    selectedMonth,
    selectedYear,
    onHouseholdSide,
    utilitySplitEnabled,
    includeBudgetExpenses = true,
    includeUtilityBills = true,
    includeGoalRows = goalsReady,
    extraMonthExpenses = [],
  } = params;

  return useMemo(() => {
    const prefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    const monthlyBills = includeUtilityBills
      ? bills.filter((b) => !utilitiesCalculations.isLegacySettlementBill(b) && b.dueDate.startsWith(prefix))
      : [];
    const monthTransactions = transactions.filter((t) => t.dueDate.startsWith(prefix));
    const monthReserves = monthTransactions.filter((t) => t.isReserve);
    const monthIncomes = monthTransactions.filter((t) => t.type === 'income' && !t.isReserve);
    const monthExpenses = [
      ...(includeBudgetExpenses
        ? monthTransactions.filter((t) => t.type === 'expense' && !t.isReserve)
        : []),
      ...(includeGoalRows ? goalBudgetRows : []),
      ...extraMonthExpenses,
    ];
    const getBillPortion = (bill: UtilityBill) =>
      utilitiesCalculations.ourUtilityPortion(bill, onHouseholdSide, utilitySplitEnabled);

    return budgetCalculations.computeBudgetCashflowMetrics({
      manualBalance,
      monthIncomes,
      monthExpenses,
      monthReserves,
      monthlyBills,
      getBillPortion,
    });
  }, [
    bills,
    extraMonthExpenses,
    goalBudgetRows,
    includeBudgetExpenses,
    includeGoalRows,
    includeUtilityBills,
    manualBalance,
    onHouseholdSide,
    selectedMonth,
    selectedYear,
    transactions,
    utilitySplitEnabled,
  ]);
}
