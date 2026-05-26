import { create } from 'zustand';
import type { Debt, AiDebtPlan } from '@/types';

interface DebtsState {
  debts: Debt[];
  aiDebtPlan: AiDebtPlan | null;
  isLoading: boolean;
  loadedWalletId: number | null;
  loadingWalletId: number | null;

  setDebts: (debts: Debt[], walletId: number) => void;
  setAiDebtPlan: (plan: AiDebtPlan | null) => void;
  setLoading: (loading: boolean, walletId?: number) => void;
  patchDebt: (id: number, updated: Debt) => void;
  appendDebt: (debt: Debt) => void;
  removeDebt: (id: number) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  debts: [] as Debt[],
  aiDebtPlan: null as AiDebtPlan | null,
  isLoading: false,
  loadedWalletId: null as number | null,
  loadingWalletId: null as number | null,
};

export function isWalletDebtsReady(
  activeWalletId: number | null,
  loadedWalletId: number | null,
  isLoading: boolean,
): boolean {
  return activeWalletId !== null && !isLoading && loadedWalletId === activeWalletId;
}

export const useDebtsStore = create<DebtsState>((set) => ({
  ...INITIAL_STATE,

  setDebts: (debts, walletId) =>
    set({
      debts,
      loadedWalletId: walletId,
      loadingWalletId: null,
      isLoading: false,
    }),

  setAiDebtPlan: (aiDebtPlan) => set({ aiDebtPlan }),

  setLoading: (isLoading, walletId) =>
    set((state) => ({
      isLoading,
      loadingWalletId: isLoading ? (walletId ?? state.loadingWalletId) : null,
      ...(isLoading && walletId !== undefined && state.loadedWalletId !== walletId
        ? { debts: [], loadedWalletId: null, aiDebtPlan: null }
        : {}),
    })),

  patchDebt: (id, updated) =>
    set((state) => ({
      debts: state.debts.map((debt) => (debt.id === id ? updated : debt)),
    })),

  appendDebt: (debt) => set((state) => ({ debts: [...state.debts, debt] })),

  removeDebt: (id) => set((state) => ({ debts: state.debts.filter((d) => d.id !== id) })),

  reset: () => set(INITIAL_STATE),
}));
