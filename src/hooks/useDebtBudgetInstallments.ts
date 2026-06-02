'use client';

import { useMemo } from 'react';
import { buildDebtBudgetExpenses } from '@/helpers/debt-budget';
import { canUseModuleWithTier } from '@/helpers/module-access';
import type { UserProfile } from '@/types';
import type { Debt } from '@/types/debts';
import type { CashTransaction } from '@/types';

export function useDebtBudgetInstallments(params: {
  debts: Debt[];
  user: UserProfile | null;
  selectedYear: number;
  selectedMonth: number;
  categories: string[];
  paymentCategoryPattern: string;
  enabled?: boolean;
}): CashTransaction[] {
  const {
    debts,
    user,
    selectedYear,
    selectedMonth,
    categories,
    paymentCategoryPattern,
    enabled = true,
  } = params;

  return useMemo(() => {
    if (!enabled || !canUseModuleWithTier(user, 'debts')) return [];
    return buildDebtBudgetExpenses(
      debts,
      selectedYear,
      selectedMonth,
      categories,
      paymentCategoryPattern,
    );
  }, [categories, debts, enabled, paymentCategoryPattern, selectedMonth, selectedYear, user]);
}
