'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import { today } from '@/lib/dates';
import type { Investment, LedgerEntry } from '@/types';
import { canEditHousehold } from '@/lib/householdRole';
import { useAuthStore } from '@/stores/useAuthStore';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface SavingsUiState {
  // Ledger modal
  isLedgerModalOpen: boolean;
  selectedSavings: number | null;
  ledgerType: 'deposit' | 'withdraw';
  ledgerAmount: string;
  ledgerReason: string;
  ledgerDate: string;
  editingLedgerId: number | null;

  // New Asset modal
  isNewAssetModalOpen: boolean;
  newAssetInitialKind: 'account' | 'goal' | 'investment';

  // Investment inline editing
  editingInvId: number | null;
  editingInvValue: string;
  editingPayoutInvId: number | null;
  editingPayoutAmount: string;
  editingPayoutDate: string;
}

// ─── Actions Interface ────────────────────────────────────────────────────────

interface SavingsUiActions {
  // Ledger modal actions
  openLedgerModal: (accId: number) => void;
  closeLedgerModal: () => void;
  clearLedgerForm: () => void;
  startEditLedger: (item: LedgerEntry) => void;
  setLedgerType: (type: 'deposit' | 'withdraw') => void;
  setLedgerAmount: (value: string) => void;
  setLedgerReason: (value: string) => void;
  setLedgerDate: (value: string) => void;

  // New Asset modal actions
  openNewAsset: (kind?: 'account' | 'goal' | 'investment') => void;
  setIsNewAssetModalOpen: (open: boolean) => void;

  // Investment inline editing actions
  startEditInvestmentValue: (inv: Investment, totalValue: number) => void;
  setEditingInvValue: (value: string) => void;
  cancelEditInvestmentValue: () => void;
  setEditingPayoutInvId: (id: number | null) => void;
  setEditingPayoutAmount: (value: string) => void;
  setEditingPayoutDate: (value: string) => void;
}

export type SavingsUiContextValue = SavingsUiState & SavingsUiActions;

// ─── Reducer ─────────────────────────────────────────────────────────────────

type SavingsUiAction =
  | { type: 'OPEN_LEDGER_MODAL'; accId: number }
  | { type: 'CLOSE_LEDGER_MODAL' }
  | { type: 'CLEAR_LEDGER_FORM' }
  | { type: 'START_EDIT_LEDGER'; item: LedgerEntry }
  | { type: 'SET_LEDGER_TYPE'; value: 'deposit' | 'withdraw' }
  | { type: 'SET_LEDGER_AMOUNT'; value: string }
  | { type: 'SET_LEDGER_REASON'; value: string }
  | { type: 'SET_LEDGER_DATE'; value: string }
  | { type: 'OPEN_NEW_ASSET'; kind: 'account' | 'goal' | 'investment' }
  | { type: 'SET_NEW_ASSET_MODAL_OPEN'; open: boolean }
  | { type: 'START_EDIT_INV_VALUE'; invId: number; value: string }
  | { type: 'SET_EDITING_INV_VALUE'; value: string }
  | { type: 'CANCEL_EDIT_INV_VALUE' }
  | { type: 'SET_EDITING_PAYOUT_INV_ID'; id: number | null }
  | { type: 'SET_EDITING_PAYOUT_AMOUNT'; value: string }
  | { type: 'SET_EDITING_PAYOUT_DATE'; value: string };

const CLEARED_LEDGER_FORM = {
  ledgerAmount: '',
  ledgerReason: '',
  ledgerDate: today(),
  ledgerType: 'deposit' as const,
  editingLedgerId: null,
};

function savingsUiReducer(state: SavingsUiState, action: SavingsUiAction): SavingsUiState {
  switch (action.type) {
    case 'OPEN_LEDGER_MODAL':
      return {
        ...state,
        ...CLEARED_LEDGER_FORM,
        selectedSavings: action.accId,
        isLedgerModalOpen: true,
      };

    case 'CLOSE_LEDGER_MODAL':
      return {
        ...state,
        ...CLEARED_LEDGER_FORM,
        isLedgerModalOpen: false,
        selectedSavings: null,
      };

    case 'CLEAR_LEDGER_FORM':
      return { ...state, ...CLEARED_LEDGER_FORM };

    case 'START_EDIT_LEDGER':
      return {
        ...state,
        editingLedgerId: action.item.id,
        ledgerAmount: String(Math.abs(action.item.amount)),
        ledgerType: action.item.amount >= 0 ? 'deposit' : 'withdraw',
        ledgerReason: action.item.reason,
        ledgerDate: action.item.date,
      };

    case 'SET_LEDGER_TYPE':
      return { ...state, ledgerType: action.value };
    case 'SET_LEDGER_AMOUNT':
      return { ...state, ledgerAmount: action.value };
    case 'SET_LEDGER_REASON':
      return { ...state, ledgerReason: action.value };
    case 'SET_LEDGER_DATE':
      return { ...state, ledgerDate: action.value };

    case 'OPEN_NEW_ASSET':
      return { ...state, newAssetInitialKind: action.kind, isNewAssetModalOpen: true };
    case 'SET_NEW_ASSET_MODAL_OPEN':
      return { ...state, isNewAssetModalOpen: action.open };

    case 'START_EDIT_INV_VALUE':
      return { ...state, editingInvId: action.invId, editingInvValue: action.value };
    case 'SET_EDITING_INV_VALUE':
      return { ...state, editingInvValue: action.value };
    case 'CANCEL_EDIT_INV_VALUE':
      return { ...state, editingInvId: null };

    case 'SET_EDITING_PAYOUT_INV_ID':
      return { ...state, editingPayoutInvId: action.id };
    case 'SET_EDITING_PAYOUT_AMOUNT':
      return { ...state, editingPayoutAmount: action.value };
    case 'SET_EDITING_PAYOUT_DATE':
      return { ...state, editingPayoutDate: action.value };

    default:
      return state;
  }
}

const INITIAL_UI_STATE: SavingsUiState = {
  isLedgerModalOpen: false,
  selectedSavings: null,
  ledgerType: 'deposit',
  ledgerAmount: '',
  ledgerReason: '',
  ledgerDate: today(),
  editingLedgerId: null,
  isNewAssetModalOpen: false,
  newAssetInitialKind: 'account',
  editingInvId: null,
  editingInvValue: '',
  editingPayoutInvId: null,
  editingPayoutAmount: '',
  editingPayoutDate: '',
};

// ─── Context ──────────────────────────────────────────────────────────────────

const SavingsUiContext = createContext<SavingsUiContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * SavingsUiProvider — wraps the Savings route to provide module-scoped UI state.
 *
 * Mount this at the Next.js route entry point so that all child components
 * share the same ledger/modal state without polluting global Zustand stores.
 * This context is NOT accessible outside the Savings module's component tree.
 */
export function SavingsUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(savingsUiReducer, INITIAL_UI_STATE);

  const openLedgerModal = useCallback((accId: number) => {
    dispatch({ type: 'OPEN_LEDGER_MODAL', accId });
  }, []);

  const closeLedgerModal = useCallback(() => {
    dispatch({ type: 'CLOSE_LEDGER_MODAL' });
  }, []);

  const clearLedgerForm = useCallback(() => {
    dispatch({ type: 'CLEAR_LEDGER_FORM' });
  }, []);

  const startEditLedger = useCallback((item: LedgerEntry) => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;
    dispatch({ type: 'START_EDIT_LEDGER', item });
  }, []);

  const setLedgerType = useCallback((value: 'deposit' | 'withdraw') => {
    dispatch({ type: 'SET_LEDGER_TYPE', value });
  }, []);

  const setLedgerAmount = useCallback((value: string) => {
    dispatch({ type: 'SET_LEDGER_AMOUNT', value });
  }, []);

  const setLedgerReason = useCallback((value: string) => {
    dispatch({ type: 'SET_LEDGER_REASON', value });
  }, []);

  const setLedgerDate = useCallback((value: string) => {
    dispatch({ type: 'SET_LEDGER_DATE', value });
  }, []);

  const openNewAsset = useCallback((kind: 'account' | 'goal' | 'investment' = 'account') => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;
    dispatch({ type: 'OPEN_NEW_ASSET', kind });
  }, []);

  const setIsNewAssetModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_NEW_ASSET_MODAL_OPEN', open });
  }, []);

  const startEditInvestmentValue = useCallback((inv: Investment, totalValue: number) => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;
    dispatch({
      type: 'START_EDIT_INV_VALUE',
      invId: inv.id,
      value: inv.currentValue ? String(inv.currentValue) : Math.round(totalValue).toString(),
    });
  }, []);

  const setEditingInvValue = useCallback((value: string) => {
    dispatch({ type: 'SET_EDITING_INV_VALUE', value });
  }, []);

  const cancelEditInvestmentValue = useCallback(() => {
    dispatch({ type: 'CANCEL_EDIT_INV_VALUE' });
  }, []);

  const setEditingPayoutInvId = useCallback((id: number | null) => {
    dispatch({ type: 'SET_EDITING_PAYOUT_INV_ID', id });
  }, []);

  const setEditingPayoutAmount = useCallback((value: string) => {
    dispatch({ type: 'SET_EDITING_PAYOUT_AMOUNT', value });
  }, []);

  const setEditingPayoutDate = useCallback((value: string) => {
    dispatch({ type: 'SET_EDITING_PAYOUT_DATE', value });
  }, []);

  const value: SavingsUiContextValue = {
    ...state,
    openLedgerModal,
    closeLedgerModal,
    clearLedgerForm,
    startEditLedger,
    setLedgerType,
    setLedgerAmount,
    setLedgerReason,
    setLedgerDate,
    openNewAsset,
    setIsNewAssetModalOpen,
    startEditInvestmentValue,
    setEditingInvValue,
    cancelEditInvestmentValue,
    setEditingPayoutInvId,
    setEditingPayoutAmount,
    setEditingPayoutDate,
  };

  return <SavingsUiContext.Provider value={value}>{children}</SavingsUiContext.Provider>;
}

// ─── Consumer Hook ─────────────────────────────────────────────────────────────

/**
 * useSavingsUi — hook to consume the module-scoped savings UI context.
 * Must be called within a <SavingsUiProvider> subtree.
 */
export function useSavingsUi(): SavingsUiContextValue {
  const ctx = useContext(SavingsUiContext);
  if (!ctx) {
    throw new Error('useSavingsUi must be used within a <SavingsUiProvider>');
  }
  return ctx;
}
