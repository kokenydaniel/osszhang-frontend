'use client';

import { useMemo } from 'react';
import { buildInsuranceBudgetExpenses } from '@/helpers/insurance-budget';
import { canUseModuleWithTier } from '@/helpers/module-access';
import type { UserProfile } from '@/types';
import type { InsurancePolicy } from '@/types/insurance';
import type { CashTransaction } from '@/types';

export function useInsuranceBudgetPremiums(params: {
  policies: InsurancePolicy[];
  user: UserProfile | null;
  selectedYear: number;
  selectedMonth: number;
  categories: string[];
  paymentCategoryPattern: string;
  enabled?: boolean;
}): CashTransaction[] {
  const {
    policies,
    user,
    selectedYear,
    selectedMonth,
    categories,
    paymentCategoryPattern,
    enabled = true,
  } = params;

  return useMemo(() => {
    if (!enabled || !canUseModuleWithTier(user, 'insurance')) return [];
    return buildInsuranceBudgetExpenses(
      policies,
      selectedYear,
      selectedMonth,
      categories,
      paymentCategoryPattern,
    );
  }, [categories, enabled, paymentCategoryPattern, policies, selectedMonth, selectedYear, user]);
}
