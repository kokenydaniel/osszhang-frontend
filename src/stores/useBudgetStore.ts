import { create } from 'zustand';
import {
  CashTransaction,
  AiOverspendAnalysis,
  AiCashflowForecast,
  AiWeeklyBriefing,
  LedgerEntry,
  isSavingsGoalTransaction,
} from '@/types';
import { budgetClient, householdClient, aiFinanceClient } from '@/lib/api-client';
import { isAbortError } from '@/lib/api-client/abortError';
import { unwrapApiData } from '@/lib/unwrapApiData';
import { useAuthStore } from './useAuthStore';
import { useUtilitiesStore } from './useUtilitiesStore';
import { usePreferenceStore } from './usePreferenceStore';
import { getActiveWalletId } from './useWalletStore';
import { syncSavingsForWallet } from '@/lib/walletDataSync';

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
  loadingWalletId: number | null;

  fetchTransactions: (walletId?: number | null, forceReload?: boolean) => Promise<void>;
  fetchGoalRows: (walletId?: number | null, month?: number, year?: number, forceReload?: boolean) => Promise<void>;
  addTransaction: (tx: Omit<CashTransaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, tx: Partial<Omit<CashTransaction, 'id' | 'subItems'>>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;

  addSubItem: (txId: number | string, item: Omit<LedgerEntry, 'id'>) => Promise<void>;
  deleteSubItem: (txId: number | string, itemId: number) => Promise<void>;

  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;

  clonePreviousMonth: (month: number, year: number, walletId?: number | null) => Promise<void>;

  fetchAiOverspend: (year: number, month: number, walletId?: number | null) => Promise<void>;
  fetchAiCashflowForecast: (year: number, month: number, walletId?: number | null) => Promise<void>;
  fetchAiWeeklyBriefing: (weekStart?: string, walletId?: number | null) => Promise<void>;

  setCategories: (categories: string[]) => void;
}

function resolveWalletId(explicit?: number | null): number | null {
  if (explicit !== undefined) return explicit;
  return getActiveWalletId();
}

function resolveBudgetPeriod(month?: number, year?: number): { month: number; year: number } {
  const pref = usePreferenceStore.getState();
  const now = new Date();
  return {
    month: month ?? pref.selectedMonth ?? now.getMonth() + 1,
    year: year ?? pref.selectedYear ?? now.getFullYear(),
  };
}

let transactionsAbortController: AbortController | null = null;
let goalRowsAbortController: AbortController | null = null;
let transactionsFetchSeq = 0;
let goalRowsFetchSeq = 0;
let aiOverspendSeq = 0;
let aiCashflowSeq = 0;
let aiWeeklySeq = 0;

export function isWalletTransactionsReady(
  activeWalletId: number | null,
  loadedWalletId: number | null,
  isLoading: boolean,
): boolean {
  return activeWalletId !== null && !isLoading && loadedWalletId === activeWalletId;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  transactions: [],
  goalBudgetRows: [],
  categories: [],
  aiOverspend: null,
  aiCashflowForecast: null,
  aiWeeklyBriefing: null,
  isLoading: false,
  isLoadingGoals: false,
  loadedWalletId: null,
  loadedMonth: null,
  loadedYear: null,
  loadingWalletId: null,

  fetchTransactions: async (walletId, forceReload = false) => {
    const resolved = resolveWalletId(walletId);
    if (resolved === null) return;

    const current = get();
    if (!forceReload && current.isLoading && current.loadingWalletId === resolved) return;
    if (!forceReload && !current.isLoading && current.loadedWalletId === resolved) return;

    transactionsAbortController?.abort();
    transactionsAbortController = new AbortController();
    const signal = transactionsAbortController.signal;
    const seq = ++transactionsFetchSeq;

    const walletChanged = current.loadedWalletId !== resolved;

    if (walletChanged) {
      goalRowsAbortController?.abort();
      goalRowsFetchSeq += 1;
    }

    set({
      isLoading: true,
      loadingWalletId: resolved,
      ...(walletChanged
        ? {
            transactions: [],
            goalBudgetRows: [],
            loadedWalletId: null,
            loadedMonth: null,
            loadedYear: null,
            aiOverspend: null,
            aiCashflowForecast: null,
          }
        : {}),
    });

    try {
      const res = await budgetClient.getAll(resolved, { signal, silent: true });
      if (seq !== transactionsFetchSeq) return;

      set({
        transactions: res.data.transactions,
        loadedWalletId: resolved,
        loadingWalletId: null,
        isLoading: false,
      });
    } catch (error) {
      if (seq !== transactionsFetchSeq) return;
      if (isAbortError(error)) return;

      console.error('Failed to fetch transactions', error);
      set({ isLoading: false, loadingWalletId: null });
    }
  },

  fetchGoalRows: async (walletId, month, year, forceReload = false) => {
    const resolved = resolveWalletId(walletId);
    if (resolved === null) return;

    const period = resolveBudgetPeriod(month, year);
    const current = get();

    if (
      !forceReload &&
      !current.isLoadingGoals &&
      current.loadedWalletId === resolved &&
      current.loadedMonth === period.month &&
      current.loadedYear === period.year
    ) {
      return;
    }

    goalRowsAbortController?.abort();
    goalRowsAbortController = new AbortController();
    const signal = goalRowsAbortController.signal;
    const seq = ++goalRowsFetchSeq;

    set({ isLoadingGoals: true });

    try {
      const res = await budgetClient.getGoalRows(resolved, period.month, period.year, { signal, silent: true });
      if (seq !== goalRowsFetchSeq) return;

      set({
        goalBudgetRows: res.data,
        loadedMonth: period.month,
        loadedYear: period.year,
        isLoadingGoals: false,
      });
    } catch (error) {
      if (seq !== goalRowsFetchSeq) return;
      if (isAbortError(error)) return;

      console.error('Failed to fetch goal rows', error);
      set({ isLoadingGoals: false });
    }
  },

  addTransaction: async (tx) => {
    const walletId = tx.walletId ?? getActiveWalletId() ?? undefined;
    const res = await budgetClient.create({ ...tx, walletId });
    set({ transactions: [...get().transactions, res.data] });
  },

  updateTransaction: async (id, tx) => {
    const previous = get().transactions;
    const current = previous.find((t) => t.id === id);
    if (!current) return;

    const optimistic = { ...current, ...tx };
    set({ transactions: previous.map((t) => (t.id === id ? optimistic : t)) });

    try {
      const res = await budgetClient.update(id, tx);
      set({ transactions: get().transactions.map((t) => (t.id === id ? res.data : t)) });
    } catch (e) {
      set({ transactions: previous });
      console.error('Failed to update transaction', e);
      throw e;
    }
  },

  deleteTransaction: async (id) => {
    const tx = get().transactions.find((t) => t.id === id);
    await budgetClient.delete(id);
    set({ transactions: get().transactions.filter((t) => t.id !== id) });
    if (tx?.category === 'Rezsi elszámolás') {
      void Promise.all([
        useUtilitiesStore.getState().fetchBills(),
        useAuthStore.getState().fetchMe(),
      ]);
    }
  },

  addSubItem: async (txId, item) => {
    const res = await budgetClient.addItem(txId, item);
    if (isSavingsGoalTransaction({ id: txId })) {
      set({
        goalBudgetRows: get().goalBudgetRows.map((row) => (row.id === txId ? res.data : row)),
      });
      void syncSavingsForWallet(get().loadedWalletId);
    } else {
      set({ transactions: get().transactions.map((t) => (t.id === txId ? res.data : t)) });
    }
  },

  deleteSubItem: async (txId, itemId) => {
    const res = await budgetClient.deleteItem(txId, itemId);
    if (isSavingsGoalTransaction({ id: txId })) {
      set({
        goalBudgetRows: get().goalBudgetRows.map((row) => (row.id === txId ? res.data : row)),
      });
      void syncSavingsForWallet(get().loadedWalletId);
    } else {
      set({ transactions: get().transactions.map((t) => (t.id === txId ? res.data : t)) });
    }
  },

  addCategory: async (name) => {
    const updated = [...get().categories, name];
    await householdClient.updateCategories(updated);
    set({ categories: updated });
  },

  deleteCategory: async (name) => {
    const updated = get().categories.filter((c) => c !== name);
    await householdClient.updateCategories(updated);
    set({ categories: updated });
  },

  clonePreviousMonth: async (m, y, walletId) => {
    const resolved = resolveWalletId(walletId);
    await budgetClient.cloneMonth(m, y, resolved);
    await Promise.all([
      get().fetchTransactions(resolved, true),
      get().fetchGoalRows(resolved, m, y, true),
    ]);
  },

  fetchAiOverspend: async (y, m, walletId) => {
    const resolved = resolveWalletId(walletId);
    const seq = ++aiOverspendSeq;

    try {
      const res = await aiFinanceClient.getOverspendRootCause(y, m, resolved);
      if (seq !== aiOverspendSeq) return;
      set({ aiOverspend: unwrapApiData<AiOverspendAnalysis>(res.data) });
    } catch (e) {
      if (isAbortError(e)) return;
      console.error('Failed to fetch AI Overspend analysis', e);
    }
  },

  fetchAiCashflowForecast: async (y, m, walletId) => {
    const resolved = resolveWalletId(walletId);
    const seq = ++aiCashflowSeq;

    try {
      const res = await aiFinanceClient.getCashflowForecast(y, m, resolved);
      if (seq !== aiCashflowSeq) return;
      set({ aiCashflowForecast: unwrapApiData<AiCashflowForecast>(res.data) });
    } catch (e) {
      if (isAbortError(e)) return;
      console.error('Failed to fetch AI Cashflow forecast', e);
    }
  },

  fetchAiWeeklyBriefing: async (weekStart, walletId) => {
    const resolved = resolveWalletId(walletId);
    const seq = ++aiWeeklySeq;

    try {
      const res = await aiFinanceClient.getWeeklyBriefing(weekStart, resolved);
      if (seq !== aiWeeklySeq) return;
      set({ aiWeeklyBriefing: unwrapApiData<AiWeeklyBriefing>(res.data) });
    } catch (e) {
      if (isAbortError(e)) return;
      console.error('Failed to fetch AI Weekly Briefing', e);
    }
  },

  setCategories: (categories) => set({ categories }),
}));
