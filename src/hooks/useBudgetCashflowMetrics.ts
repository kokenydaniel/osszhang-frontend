'use client';

import { useMemo } from 'react';
import { BudgetService, type BudgetCashflowMetrics } from '@/services/BudgetService';
import { UtilitiesService } from '@/services/UtilitiesService';
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
  } = params;

  return useMemo(() => {
    const prefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    const monthlyBills = includeUtilityBills
      ? bills.filter((b) => !UtilitiesService.isLegacySettlementBill(b) && b.dueDate.startsWith(prefix))
      : [];
    const monthTransactions = transactions.filter((t) => t.dueDate.startsWith(prefix));
    const monthReserves = monthTransactions.filter((t) => t.isReserve);
    const monthIncomes = monthTransactions.filter((t) => t.type === 'income' && !t.isReserve);
    const monthExpenses = [
      ...(includeBudgetExpenses
        ? monthTransactions.filter((t) => t.type === 'expense' && !t.isReserve)
        : []),
      ...(includeGoalRows ? goalBudgetRows : []),
    ];
    const getBillPortion = (bill: UtilityBill) =>
      UtilitiesService.ourUtilityPortion(bill, onHouseholdSide, utilitySplitEnabled);

    return BudgetService.computeBudgetCashflowMetrics({
      manualBalance,
      monthIncomes,
      monthExpenses,
      monthReserves,
      monthlyBills,
      getBillPortion,
    });
  }, [
    bills,
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
