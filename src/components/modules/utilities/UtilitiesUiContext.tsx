'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import { today } from '@/lib/dates';
import type { UtilityBill, UtilitySplitRule } from '@/types';

interface UtilitiesUiState {
  isBillModalOpen: boolean;
  editingBill: UtilityBill | null;
  type: string;
  total: string;
  dueDate: string;
  splitRule: UtilitySplitRule;
}

interface UtilitiesUiActions {
  openNewBillModal: () => void;
  openEditBill: (bill: UtilityBill) => void;
  closeBillModal: () => void;
  setType: (type: string) => void;
  setTotal: (total: string) => void;
  setDueDate: (dueDate: string) => void;
  setSplitRule: (rule: UtilitySplitRule) => void;
  resetBillForm: () => void;
}

export type UtilitiesUiContextValue = UtilitiesUiState & UtilitiesUiActions;

type UtilitiesUiAction =
  | { type: 'OPEN_NEW_BILL_MODAL' }
  | { type: 'OPEN_EDIT_BILL'; bill: UtilityBill }
  | { type: 'CLOSE_BILL_MODAL' }
  | { type: 'SET_TYPE'; value: string }
  | { type: 'SET_TOTAL'; value: string }
  | { type: 'SET_DUE_DATE'; value: string }
  | { type: 'SET_SPLIT_RULE'; value: UtilitySplitRule }
  | { type: 'RESET_BILL_FORM' };

const INITIAL_UI_STATE: UtilitiesUiState = {
  isBillModalOpen: false,
  editingBill: null,
  type: '',
  total: '',
  dueDate: today(),
  splitRule: 'shared',
};

function utilitiesUiReducer(state: UtilitiesUiState, action: UtilitiesUiAction): UtilitiesUiState {
  switch (action.type) {
    case 'OPEN_NEW_BILL_MODAL':
      return {
        ...INITIAL_UI_STATE,
        isBillModalOpen: true,
        dueDate: today(),
      };
    case 'OPEN_EDIT_BILL':
      return {
        ...state,
        editingBill: action.bill,
        type: action.bill.type,
        total: action.bill.total.toString(),
        dueDate: action.bill.dueDate,
        splitRule: action.bill.splitRule,
        isBillModalOpen: true,
      };
    case 'CLOSE_BILL_MODAL':
      return {
        ...INITIAL_UI_STATE,
      };
    case 'SET_TYPE':
      return { ...state, type: action.value };
    case 'SET_TOTAL':
      return { ...state, total: action.value };
    case 'SET_DUE_DATE':
      return { ...state, dueDate: action.value };
    case 'SET_SPLIT_RULE':
      return { ...state, splitRule: action.value };
    case 'RESET_BILL_FORM':
      return {
        ...state,
        editingBill: null,
        type: '',
        total: '',
        dueDate: today(),
        splitRule: 'shared',
      };
    default:
      return state;
  }
}

const UtilitiesUiContext = createContext<UtilitiesUiContextValue | null>(null);

export function UtilitiesUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(utilitiesUiReducer, INITIAL_UI_STATE);

  const openNewBillModal = useCallback(() => {
    dispatch({ type: 'OPEN_NEW_BILL_MODAL' });
  }, []);

  const openEditBill = useCallback((bill: UtilityBill) => {
    dispatch({ type: 'OPEN_EDIT_BILL', bill });
  }, []);

  const closeBillModal = useCallback(() => {
    dispatch({ type: 'CLOSE_BILL_MODAL' });
  }, []);

  const setType = useCallback((value: string) => {
    dispatch({ type: 'SET_TYPE', value });
  }, []);

  const setTotal = useCallback((value: string) => {
    dispatch({ type: 'SET_TOTAL', value });
  }, []);

  const setDueDate = useCallback((value: string) => {
    dispatch({ type: 'SET_DUE_DATE', value });
  }, []);

  const setSplitRule = useCallback((value: UtilitySplitRule) => {
    dispatch({ type: 'SET_SPLIT_RULE', value });
  }, []);

  const resetBillForm = useCallback(() => {
    dispatch({ type: 'RESET_BILL_FORM' });
  }, []);

  const value: UtilitiesUiContextValue = {
    ...state,
    openNewBillModal,
    openEditBill,
    closeBillModal,
    setType,
    setTotal,
    setDueDate,
    setSplitRule,
    resetBillForm,
  };

  return <UtilitiesUiContext.Provider value={value}>{children}</UtilitiesUiContext.Provider>;
}

export function useUtilitiesUi(): UtilitiesUiContextValue {
  const ctx = useContext(UtilitiesUiContext);
  if (!ctx) {
    throw new Error('useUtilitiesUi must be used within UtilitiesUiProvider');
  }
  return ctx;
}
