import { create } from 'zustand';
import type { SavingsAccount, AiSavingsPlan, Investment } from '@/types';

/**
 * useSavingsStore — global server-data cache for the Savings domain.
 *
 * This store is intentionally "dumb": it holds data and exposes only
 * primitive setters. All I/O orchestration lives in SavingsService +
 * useSavingsLogic. All UI state lives in SavingsUiContext.
 *
 * It remains GLOBAL (not context-local) because:
 *  - The Budget module reads savings data for goal-row syncing
 *  - Wallet switching (useWalletStore) triggers a savings reload cross-module
 */

interface SavingsState {
  // ── Server data ────────────────────────────────────────────────────────────
  savings: SavingsAccount[];
  investments: Investment[];
  aiSavingsPlan: AiSavingsPlan | null;

  // ── Loading state ──────────────────────────────────────────────────────────
  isLoading: boolean;
  loadedWalletId: number | null;
  loadingWalletId: number | null;

  // ── Setters (called by useSavingsLogic / SavingsService, never by components) ──
  setSavings: (data: SavingsAccount[], walletId: number) => void;
  setInvestments: (data: Investment[]) => void;
  setAiSavingsPlan: (plan: AiSavingsPlan | null) => void;
  setLoading: (loading: boolean, walletId?: number) => void;

  patchSavingsItem: (id: number, updated: SavingsAccount) => void;
  appendSavingsItem: (item: SavingsAccount) => void;
  removeSavingsItem: (id: number) => void;

  patchInvestment: (id: number, updated: Investment) => void;
  appendInvestment: (item: Investment) => void;
  removeInvestment: (id: number) => void;

  reset: () => void;
}

const INITIAL_STATE = {
  savings: [] as SavingsAccount[],
  investments: [] as Investment[],
  aiSavingsPlan: null,
  isLoading: false,
  loadedWalletId: null,
  loadingWalletId: null,
};

export const useSavingsStore = create<SavingsState>((set, get) => ({
  ...INITIAL_STATE,

  setSavings: (data, walletId) =>
    set({
      savings: data,
      loadedWalletId: walletId,
      loadingWalletId: null,
      isLoading: false,
    }),

  setInvestments: (data) => set({ investments: data }),

  setAiSavingsPlan: (plan) => set({ aiSavingsPlan: plan }),

  setLoading: (loading, walletId) =>
    set({
      isLoading: loading,
      ...(walletId !== undefined ? { loadingWalletId: loading ? walletId : null } : {}),
    }),

  patchSavingsItem: (id, updated) =>
    set({ savings: get().savings.map((s) => (s.id === id ? updated : s)) }),

  appendSavingsItem: (item) =>
    set({ savings: [...get().savings, item] }),

  removeSavingsItem: (id) =>
    set({ savings: get().savings.filter((s) => s.id !== id) }),

  patchInvestment: (id, updated) =>
    set({ investments: get().investments.map((i) => (i.id === id ? updated : i)) }),

  appendInvestment: (item) =>
    set({ investments: [...get().investments, item] }),

  removeInvestment: (id) =>
    set({ investments: get().investments.filter((i) => i.id !== id) }),

  reset: () => set(INITIAL_STATE),
}));

// ─── Selector helpers ─────────────────────────────────────────────────────────

/** Convenience guard used by the Budget module to check if savings are loaded. */
export function isWalletSavingsReady(
  activeWalletId: number | null,
  loadedWalletId: number | null,
  isLoading: boolean,
): boolean {
  return activeWalletId !== null && !isLoading && loadedWalletId === activeWalletId;
}
