import { create } from 'zustand';
import { Debt, AiDebtPlan } from '@/types';
import { debtsClient, aiFinanceClient } from '@/lib/api-client';
import { isAbortError } from '@/lib/api-client/abortError';
import { unwrapApiData } from '@/lib/unwrapApiData';
import { getActiveWalletId } from './useWalletStore';

interface DebtsState {
  debts: Debt[];
  aiDebtPlan: AiDebtPlan | null;
  isLoading: boolean;
  loadedWalletId: number | null;
  loadingWalletId: number | null;

  fetchDebts: (walletId?: number | null) => Promise<void>;
  addDebt: (d: Omit<Debt, 'id'>) => Promise<void>;
  updateDebt: (id: number, d: Partial<Omit<Debt, 'id'>>) => Promise<void>;
  deleteDebt: (id: number) => Promise<void>;

  fetchAiDebtPlan: (strategy?: 'avalanche' | 'snowball', walletId?: number | null) => Promise<void>;
}

function resolveWalletId(explicit?: number | null): number | null {
  if (explicit !== undefined) return explicit;
  return getActiveWalletId();
}

let debtsAbortController: AbortController | null = null;
let debtsFetchSeq = 0;

export function isWalletDebtsReady(
  activeWalletId: number | null,
  loadedWalletId: number | null,
  isLoading: boolean,
): boolean {
  return activeWalletId !== null && !isLoading && loadedWalletId === activeWalletId;
}

export const useDebtsStore = create<DebtsState>((set, get) => ({
  debts: [],
  aiDebtPlan: null,
  isLoading: false,
  loadedWalletId: null,
  loadingWalletId: null,

  fetchDebts: async (walletId) => {
    const resolved = resolveWalletId(walletId);
    if (resolved === null) return;

    const current = get();
    if (current.loadingWalletId === resolved && current.isLoading) return;
    if (!current.isLoading && current.loadedWalletId === resolved) return;

    debtsAbortController?.abort();
    debtsAbortController = new AbortController();
    const signal = debtsAbortController.signal;
    const seq = ++debtsFetchSeq;
    const walletChanged = current.loadedWalletId !== resolved;

    set({
      isLoading: true,
      loadingWalletId: resolved,
      ...(walletChanged ? { debts: [], loadedWalletId: null, aiDebtPlan: null } : {}),
    });

    try {
      const res = await debtsClient.getAll(resolved, { signal });
      if (seq !== debtsFetchSeq) return;

      set({
        debts: res.data,
        loadedWalletId: resolved,
        loadingWalletId: null,
        isLoading: false,
      });
    } catch (error) {
      if (seq !== debtsFetchSeq) return;
      if (isAbortError(error)) return;

      console.error('Failed to fetch debts', error);
      set({ isLoading: false, loadingWalletId: null });
    }
  },

  addDebt: async (d) => {
    const walletId = d.walletId ?? getActiveWalletId() ?? undefined;
    const res = await debtsClient.create({ ...d, walletId });
    set({ debts: [...get().debts, res.data] });
  },

  updateDebt: async (id, d) => {
    const res = await debtsClient.update(id, d);
    set({ debts: get().debts.map((debt) => (debt.id === id ? res.data : debt)) });
  },

  deleteDebt: async (id) => {
    await debtsClient.delete(id);
    set({ debts: get().debts.filter((d) => d.id !== id) });
  },

  fetchAiDebtPlan: async (strategy, walletId) => {
    try {
      const resolvedWalletId = walletId ?? getActiveWalletId();
      const res = await aiFinanceClient.optimizeDebts({
        strategy,
        ...(resolvedWalletId != null ? { wallet_id: resolvedWalletId } : {}),
      });
      set({ aiDebtPlan: unwrapApiData<AiDebtPlan>(res.data) });
    } catch (e) {
      console.error('Failed to fetch AI Debt optimization strategy', e);
    }
  },
}));
