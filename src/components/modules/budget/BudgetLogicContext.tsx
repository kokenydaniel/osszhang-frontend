'use client';

import { createContext, useContext } from 'react';
import {
  useBudgetLogicState,
  type BudgetLogicResult,
} from '@/components/modules/budget/hooks/useBudgetLogic';

export type { BudgetLogicResult };

const BudgetLogicContext = createContext<BudgetLogicResult | null>(null);

export function BudgetLogicProvider({ children }: { children: React.ReactNode }) {
  const logic = useBudgetLogicState();
  return <BudgetLogicContext.Provider value={logic}>{children}</BudgetLogicContext.Provider>;
}

export function useBudgetLogic(): BudgetLogicResult {
  const context = useContext(BudgetLogicContext);
  if (!context) {
    throw new Error('useBudgetLogic must be used within BudgetLogicProvider');
  }
  return context;
}
