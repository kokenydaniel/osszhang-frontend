'use client';

import { useMemo } from 'react';
import { buildRentalBudgetIncomes } from '@/helpers/rental-budget';
import { canUseModuleWithTier } from '@/helpers/module-access';
import type { UserProfile } from '@/types';
import type { RentalIncomeEntry, RentalProperty } from '@/types/rental';
import type { CashTransaction } from '@/types';

export function useRentalBudgetIncomes(params: {
  properties: RentalProperty[];
  incomeEntries: RentalIncomeEntry[];
  user: UserProfile | null;
  selectedYear: number;
  selectedMonth: number;
  categories: string[];
  incomeCategoryPattern: string;
  enabled?: boolean;
}): CashTransaction[] {
  const {
    properties,
    incomeEntries,
    user,
    selectedYear,
    selectedMonth,
    categories,
    incomeCategoryPattern,
    enabled = true,
  } = params;

  return useMemo(() => {
    if (!enabled || !canUseModuleWithTier(user, 'rental')) return [];
    return buildRentalBudgetIncomes(
      properties,
      incomeEntries,
      selectedYear,
      selectedMonth,
      categories,
      incomeCategoryPattern,
    );
  }, [
    categories,
    enabled,
    incomeCategoryPattern,
    incomeEntries,
    properties,
    selectedMonth,
    selectedYear,
    user,
  ]);
}
