import { create } from 'zustand';
import { SavingsAccount, AiSavingsPlan, LedgerEntry, Investment } from '@/types';
import { savingsClient, investmentsClient, aiFinanceClient } from '@/lib/api-client';
import { mapSavingsAccountFromApi, mapSavingsAccountsFromApi, savingsAccountToApiPayload } from '@/lib/mapSavings';
import { isAbortError } from '@/lib/api-client/abortError';
import { unwrapApiData } from '@/lib/unwrapApiData';
import { getActiveWalletId } from './useWalletStore';
import { refreshBudgetGoalRows } from '@/lib/walletDataSync';

interface SavingsFetchOptions {
  silent?: boolean;
  forceReload?: boolean;
}

interface CreateSavingsPayload {
  type: 'account' | 'goal';
  institution: string;
  currency?: string;
  owner?: string;
  count_in_savings?: boolean;
  goalAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  walletId?: number | null;
}

interface SavingsState {
  savings: SavingsAccount[];
  investments: Investment[];
  aiSavingsPlan: AiSavingsPlan | null;
  isLoading: boolean;
  loadedWalletId: number | null;
  loadingWalletId: number | null;

  fetchSavings: (walletId?: number | null, options?: SavingsFetchOptions) => Promise<void>;
  addSavingsAccount: (payload: CreateSavingsPayload) => Promise<void>;
  updateSavingsAccount: (id: number, s: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) => Promise<void>;
  deleteSavingsAccount: (id: number) => Promise<void>;

  addLedgerEntry: (savingsId: number, entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  updateLedgerEntry: (savingsId: number, entryId: number, entry: Partial<Omit<LedgerEntry, 'id'>>) => Promise<void>;
  deleteLedgerEntry: (savingsId: number, entryId: number) => Promise<void>;

  fetchInvestments: (options?: SavingsFetchOptions) => Promise<void>;
  addInvestment: (i: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: number, i: Partial<Omit<Investment, 'id'>>) => Promise<void>;
  deleteInvestment: (id: number) => Promise<void>;

  fetchAiSavingsPlan: (payload: {
    goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
    constraints?: { min_buffer?: number };
    walletId?: number | null;
  }) => Promise<void>;
}

function resolveWalletId(explicit?: number | null): number | null {
  if (explicit !== undefined) return explicit;
  return getActiveWalletId();
}

let savingsAbortController: AbortController | null = null;
let savingsFetchSeq = 0;

export function isWalletSavingsReady(
  activeWalletId: number | null,
  loadedWalletId: number | null,
  isLoading: boolean,
): boolean {
  return activeWalletId !== null && !isLoading && loadedWalletId === activeWalletId;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  savings: [],
  investments: [],
  aiSavingsPlan: null,
  isLoading: false,
  loadedWalletId: null,
  loadingWalletId: null,

  fetchSavings: async (walletId, options) => {
    const resolved = resolveWalletId(walletId);
    if (resolved === null) return;

    const forceReload = options?.forceReload ?? false;
    const current = get();
    if (!forceReload && current.loadingWalletId === resolved && current.isLoading) return;
    if (!forceReload && !current.isLoading && current.loadedWalletId === resolved) return;

    savingsAbortController?.abort();
    savingsAbortController = new AbortController();
    const signal = savingsAbortController.signal;
    const seq = ++savingsFetchSeq;
    const walletChanged = current.loadedWalletId !== resolved;

    set({
      isLoading: true,
      loadingWalletId: resolved,
      ...(walletChanged && !forceReload ? { savings: [], loadedWalletId: null, aiSavingsPlan: null } : {}),
    });

    try {
      const res = await savingsClient.getAll(resolved, { signal, silent: options?.silent });
      if (seq !== savingsFetchSeq) return;

      set({
        savings: mapSavingsAccountsFromApi(res.data as Parameters<typeof mapSavingsAccountsFromApi>[0]),
        loadedWalletId: resolved,
        loadingWalletId: null,
        isLoading: false,
      });
    } catch (error) {
      if (seq !== savingsFetchSeq) return;
      if (isAbortError(error)) return;

      console.error('Failed to fetch savings', error);
      set({ isLoading: false, loadingWalletId: null });
    }
  },

  addSavingsAccount: async (s) => {
    const walletId = s.walletId ?? getActiveWalletId() ?? undefined;
    const res = await savingsClient.create(
      savingsAccountToApiPayload({
        type: s.type,
        institution: s.institution,
        currency: s.currency ?? 'HUF',
        owner: s.owner,
        count_in_savings: s.count_in_savings,
        ...(s.type === 'goal'
          ? {
              goalAmount: s.goalAmount,
              currentAmount: s.currentAmount ?? 0,
              targetDate: s.targetDate,
            }
          : {}),
        walletId,
      }),
    );
    set({
      savings: [
        ...get().savings,
        mapSavingsAccountFromApi(res.data as Parameters<typeof mapSavingsAccountFromApi>[0]),
      ],
    });
  },

  updateSavingsAccount: async (id, s) => {
    const prev = get().savings;
    set({
      savings: prev.map((acc) => (acc.id === id ? { ...acc, ...s } : acc)),
    });
    try {
      const res = await savingsClient.update(id, savingsAccountToApiPayload(s) as Partial<Omit<SavingsAccount, 'id' | 'ledger'>>);
      set({
        savings: get().savings.map((acc) =>
          acc.id === id ? mapSavingsAccountFromApi(res.data as Parameters<typeof mapSavingsAccountFromApi>[0]) : acc,
        ),
      });
    } catch (e) {
      set({ savings: prev });
      throw e;
    }
  },

  deleteSavingsAccount: async (id) => {
    await savingsClient.delete(id);
    set({ savings: get().savings.filter((s) => s.id !== id) });
  },

  addLedgerEntry: async (savingsId, entry) => {
    const res = await savingsClient.addEntry(savingsId, entry);
    set({
      savings: get().savings.map((s) =>
        s.id === savingsId ? mapSavingsAccountFromApi(res.data as Parameters<typeof mapSavingsAccountFromApi>[0]) : s,
      ),
    });
    refreshBudgetGoalRows();
  },

  updateLedgerEntry: async (savingsId, entryId, entry) => {
    const res = await savingsClient.updateEntry(savingsId, entryId, entry);
    set({
      savings: get().savings.map((s) =>
        s.id === savingsId ? mapSavingsAccountFromApi(res.data as Parameters<typeof mapSavingsAccountFromApi>[0]) : s,
      ),
    });
    refreshBudgetGoalRows();
  },

  deleteLedgerEntry: async (savingsId, entryId) => {
    const res = await savingsClient.deleteEntry(savingsId, entryId);
    set({
      savings: get().savings.map((s) =>
        s.id === savingsId ? mapSavingsAccountFromApi(res.data as Parameters<typeof mapSavingsAccountFromApi>[0]) : s,
      ),
    });
    refreshBudgetGoalRows();
  },

  fetchInvestments: async (options) => {
    set({ isLoading: true });
    try {
      const res = await investmentsClient.getAll({ silent: options?.silent });
      set({ investments: res.data });
    } catch (e) {
      console.error('Failed to fetch investments', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addInvestment: async (i) => {
    const res = await investmentsClient.create(i);
    set({ investments: [...get().investments, res.data] });
  },

  updateInvestment: async (id, i) => {
    const prev = get().investments;
    set({
      investments: prev.map((inv) => (inv.id === id ? { ...inv, ...i } : inv)),
    });
    try {
      const res = await investmentsClient.update(id, i);
      set({ investments: get().investments.map((inv) => (inv.id === id ? res.data : inv)) });
    } catch (e) {
      set({ investments: prev });
      throw e;
    }
  },

  deleteInvestment: async (id) => {
    await investmentsClient.delete(id);
    set({ investments: get().investments.filter((i) => i.id !== id) });
  },

  fetchAiSavingsPlan: async (payload) => {
    try {
      const walletId = payload.walletId ?? getActiveWalletId();
      const res = await aiFinanceClient.getSavingsRecommendations({
        goals: payload.goals,
        constraints: payload.constraints,
        ...(walletId != null ? { wallet_id: walletId } : {}),
      });
      set({ aiSavingsPlan: unwrapApiData<AiSavingsPlan>(res.data) });
    } catch (e) {
      console.error('Failed to fetch AI Savings plan', e);
    }
  },
}));
