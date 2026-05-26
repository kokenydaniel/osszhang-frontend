import { create } from 'zustand';
import type { CashTransaction, AiOverspendAnalysis, AiCashflowForecast, AiWeeklyBriefing } from '@/types';
import { getActiveWalletId } from './useWalletStore';

interface BudgetState {
  transactions: CashTransaction[];
  goalBudgetRows: CashTransaction[];
  categories: string[];
  aiOverspend: AiOverspendAnalysis | null;
  aiCashflowForecast: AiCashflowForecast | null;
  aiWeeklyBriefing: AiWeeklyBriefing | null;
  isLoading: boolean;
  isLoadingGoals: boolean;
  loadedWalletId: number | null;
  loadedMonth: number | null;
  loadedYear: number | null;

  setTransactions: (transactions: CashTransaction[], walletId: number) => void;
  setGoalRows: (rows: CashTransaction[], month: number, year: number, walletId: number) => void;
  setCategories: (categories: string[]) => void;
  setAiOverspend: (analysis: AiOverspendAnalysis | null) => void;
  setAiCashflowForecast: (forecast: AiCashflowForecast | null) => void;
  setAiWeeklyBriefing: (briefing: AiWeeklyBriefing | null) => void;
  
  setIsLoading: (isLoading: boolean) => void;
  setIsLoadingGoals: (isLoadingGoals: boolean) => void;
  
  resetWalletState: (walletId: number) => void;
  reset: () => void;
}

const INITIAL_BUDGET_STATE = {
  transactions: [] as CashTransaction[],
  goalBudgetRows: [] as CashTransaction[],
  categories: [] as string[],
  aiOverspend: null as AiOverspendAnalysis | null,
  aiCashflowForecast: null as AiCashflowForecast | null,
  aiWeeklyBriefing: null as AiWeeklyBriefing | null,
  isLoading: false,
  isLoadingGoals: false,
  loadedWalletId: null as number | null,
  loadedMonth: null as number | null,
  loadedYear: null as number | null,
};

export function isWalletTransactionsReady(
  activeWalletId: number | null,
  loadedWalletId: number | null,
  isLoading: boolean,
): boolean {
  return activeWalletId !== null && !isLoading && loadedWalletId === activeWalletId;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  ...INITIAL_BUDGET_STATE,

  setTransactions: (transactions, walletId) => set({
    transactions,
    loadedWalletId: walletId,
    isLoading: false,
  }),

  setGoalRows: (goalBudgetRows, month, year, walletId) => set({
    goalBudgetRows,
    loadedMonth: month,
    loadedYear: year,
    loadedWalletId: walletId,
    isLoadingGoals: false,
  }),

  setCategories: (categories) => set({ categories }),
  
  setAiOverspend: (aiOverspend) => set({ aiOverspend }),
  
  setAiCashflowForecast: (aiCashflowForecast) => set({ aiCashflowForecast }),
  
  setAiWeeklyBriefing: (aiWeeklyBriefing) => set({ aiWeeklyBriefing }),

  setIsLoading: (isLoading) => set({ isLoading }),
  
  setIsLoadingGoals: (isLoadingGoals) => set({ isLoadingGoals }),

  resetWalletState: (walletId) => set({
    transactions: [],
    goalBudgetRows: [],
    loadedWalletId: walletId,
    loadedMonth: null,
    loadedYear: null,
    aiOverspend: null,
    aiCashflowForecast: null,
  }),

  reset: () => set(INITIAL_BUDGET_STATE),
}));
