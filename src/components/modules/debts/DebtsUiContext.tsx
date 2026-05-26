'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import { today } from '@/lib/dates';
import type { Debt } from '@/types';
import type { DebtStrategy, DebtsSettings } from '@/lib/debtsSettings';

interface DebtsUiState {
  isDebtFormOpen: boolean;
  editId: number | null;
  name: string;
  targetAmount: string;
  paidAmount: string;
  annualInterestRate: string;
  minimumPayment: string;
  dueDay: string;

  isPayModalOpen: boolean;
  payDebt: Debt | null;
  payAmount: string;
  payDate: string;
  payNote: string;
  payAddToBudget: boolean;
  payCategory: string;
  paySaving: boolean;

  strategy: DebtStrategy;
  isAiLoading: boolean;
  extraMonthly: number;
}

interface DebtsUiActions {
  openDebtForm: (debt?: Debt) => void;
  closeDebtForm: () => void;
  setName: (value: string) => void;
  setTargetAmount: (value: string) => void;
  setPaidAmount: (value: string) => void;
  setAnnualInterestRate: (value: string) => void;
  setMinimumPayment: (value: string) => void;
  setDueDay: (value: string) => void;

  openPayModal: (payload: {
    debt: Debt;
    payAmount: string;
    payDate: string;
    payNote: string;
    payAddToBudget: boolean;
    payCategory: string;
  }) => void;
  closePayModal: () => void;
  setPayAmount: (value: string) => void;
  setPayDate: (value: string) => void;
  setPayNote: (value: string) => void;
  setPayAddToBudget: (value: boolean) => void;
  setPayCategory: (value: string) => void;
  setPaySaving: (value: boolean) => void;

  setStrategy: (strategy: DebtStrategy) => void;
  setExtraMonthly: (value: number | ((current: number) => number)) => void;
  setIsAiLoading: (value: boolean) => void;
  applyHouseholdDefaults: (settings: DebtsSettings) => void;
  syncPayCategory: (categories: string[], pattern: string) => void;
}

export type DebtsUiContextValue = DebtsUiState & DebtsUiActions;

type DebtsUiAction =
  | { type: 'OPEN_DEBT_FORM'; debt?: Debt }
  | { type: 'CLOSE_DEBT_FORM' }
  | { type: 'SET_NAME'; value: string }
  | { type: 'SET_TARGET_AMOUNT'; value: string }
  | { type: 'SET_PAID_AMOUNT'; value: string }
  | { type: 'SET_ANNUAL_INTEREST_RATE'; value: string }
  | { type: 'SET_MINIMUM_PAYMENT'; value: string }
  | { type: 'SET_DUE_DAY'; value: string }
  | {
      type: 'OPEN_PAY_MODAL';
      debt: Debt;
      payAmount: string;
      payDate: string;
      payNote: string;
      payAddToBudget: boolean;
      payCategory: string;
    }
  | { type: 'CLOSE_PAY_MODAL' }
  | { type: 'SET_PAY_AMOUNT'; value: string }
  | { type: 'SET_PAY_DATE'; value: string }
  | { type: 'SET_PAY_NOTE'; value: string }
  | { type: 'SET_PAY_ADD_TO_BUDGET'; value: boolean }
  | { type: 'SET_PAY_CATEGORY'; value: string }
  | { type: 'SET_PAY_SAVING'; value: boolean }
  | { type: 'SET_STRATEGY'; strategy: DebtStrategy }
  | { type: 'SET_EXTRA_MONTHLY'; value: number | ((current: number) => number) }
  | { type: 'SET_IS_AI_LOADING'; value: boolean }
  | { type: 'APPLY_HOUSEHOLD_DEFAULTS'; settings: DebtsSettings }
  | { type: 'SYNC_PAY_CATEGORY'; categories: string[]; pattern: string };

const INITIAL_UI_STATE: DebtsUiState = {
  isDebtFormOpen: false,
  editId: null,
  name: '',
  targetAmount: '',
  paidAmount: '',
  annualInterestRate: '',
  minimumPayment: '',
  dueDay: '',

  isPayModalOpen: false,
  payDebt: null,
  payAmount: '',
  payDate: today(),
  payNote: '',
  payAddToBudget: true,
  payCategory: '',
  paySaving: false,

  strategy: 'avalanche',
  isAiLoading: false,
  extraMonthly: 0,
};

function debtsUiReducer(state: DebtsUiState, action: DebtsUiAction): DebtsUiState {
  switch (action.type) {
    case 'OPEN_DEBT_FORM':
      if (action.debt) {
        return {
          ...state,
          editId: action.debt.id,
          name: action.debt.name,
          targetAmount: String(action.debt.targetAmount),
          paidAmount: String(action.debt.paidAmount),
          annualInterestRate: action.debt.annualInterestRate ? String(action.debt.annualInterestRate) : '',
          minimumPayment: action.debt.minimumPayment ? String(action.debt.minimumPayment) : '',
          dueDay: action.debt.dueDay ? String(action.debt.dueDay) : '',
          isDebtFormOpen: true,
        };
      }
      return {
        ...state,
        editId: null,
        name: '',
        targetAmount: '',
        paidAmount: '0',
        annualInterestRate: '',
        minimumPayment: '',
        dueDay: '',
        isDebtFormOpen: true,
      };

    case 'CLOSE_DEBT_FORM':
      return { ...state, isDebtFormOpen: false, editId: null };

    case 'SET_NAME':
      return { ...state, name: action.value };
    case 'SET_TARGET_AMOUNT':
      return { ...state, targetAmount: action.value };
    case 'SET_PAID_AMOUNT':
      return { ...state, paidAmount: action.value };
    case 'SET_ANNUAL_INTEREST_RATE':
      return { ...state, annualInterestRate: action.value };
    case 'SET_MINIMUM_PAYMENT':
      return { ...state, minimumPayment: action.value };
    case 'SET_DUE_DAY':
      return { ...state, dueDay: action.value };

    case 'OPEN_PAY_MODAL':
      return {
        ...state,
        payDebt: action.debt,
        payAmount: action.payAmount,
        payDate: action.payDate,
        payNote: action.payNote,
        payAddToBudget: action.payAddToBudget,
        payCategory: action.payCategory,
        isPayModalOpen: true,
      };

    case 'CLOSE_PAY_MODAL':
      return { ...state, isPayModalOpen: false, payDebt: null, paySaving: false };

    case 'SET_PAY_AMOUNT':
      return { ...state, payAmount: action.value };
    case 'SET_PAY_DATE':
      return { ...state, payDate: action.value };
    case 'SET_PAY_NOTE':
      return { ...state, payNote: action.value };
    case 'SET_PAY_ADD_TO_BUDGET':
      return { ...state, payAddToBudget: action.value };
    case 'SET_PAY_CATEGORY':
      return { ...state, payCategory: action.value };
    case 'SET_PAY_SAVING':
      return { ...state, paySaving: action.value };

    case 'SET_STRATEGY':
      return { ...state, strategy: action.strategy };
    case 'SET_EXTRA_MONTHLY':
      return {
        ...state,
        extraMonthly:
          typeof action.value === 'function' ? action.value(state.extraMonthly) : action.value,
      };
    case 'SET_IS_AI_LOADING':
      return { ...state, isAiLoading: action.value };

    case 'APPLY_HOUSEHOLD_DEFAULTS':
      return {
        ...state,
        strategy: action.settings.default_strategy,
        extraMonthly: action.settings.default_extra_monthly,
        payAddToBudget: action.settings.pay_add_to_budget_default,
      };

    case 'SYNC_PAY_CATEGORY': {
      if (action.categories.length === 0) return state;
      try {
        const regex = new RegExp(action.pattern, 'i');
        const def = action.categories.find((c) => regex.test(c)) ?? action.categories[0];
        return { ...state, payCategory: state.payCategory || def };
      } catch {
        return { ...state, payCategory: state.payCategory || action.categories[0] };
      }
    }

    default:
      return state;
  }
}

const DebtsUiContext = createContext<DebtsUiContextValue | null>(null);

export function DebtsUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(debtsUiReducer, INITIAL_UI_STATE);

  const openDebtForm = useCallback((debt?: Debt) => {
    dispatch({ type: 'OPEN_DEBT_FORM', debt });
  }, []);

  const closeDebtForm = useCallback(() => {
    dispatch({ type: 'CLOSE_DEBT_FORM' });
  }, []);

  const setName = useCallback((value: string) => dispatch({ type: 'SET_NAME', value }), []);
  const setTargetAmount = useCallback((value: string) => dispatch({ type: 'SET_TARGET_AMOUNT', value }), []);
  const setPaidAmount = useCallback((value: string) => dispatch({ type: 'SET_PAID_AMOUNT', value }), []);
  const setAnnualInterestRate = useCallback(
    (value: string) => dispatch({ type: 'SET_ANNUAL_INTEREST_RATE', value }),
    [],
  );
  const setMinimumPayment = useCallback((value: string) => dispatch({ type: 'SET_MINIMUM_PAYMENT', value }), []);
  const setDueDay = useCallback((value: string) => dispatch({ type: 'SET_DUE_DAY', value }), []);

  const openPayModal = useCallback((payload: Parameters<DebtsUiActions['openPayModal']>[0]) => {
    dispatch({ type: 'OPEN_PAY_MODAL', ...payload });
  }, []);

  const closePayModal = useCallback(() => {
    dispatch({ type: 'CLOSE_PAY_MODAL' });
  }, []);

  const setPayAmount = useCallback((value: string) => dispatch({ type: 'SET_PAY_AMOUNT', value }), []);
  const setPayDate = useCallback((value: string) => dispatch({ type: 'SET_PAY_DATE', value }), []);
  const setPayNote = useCallback((value: string) => dispatch({ type: 'SET_PAY_NOTE', value }), []);
  const setPayAddToBudget = useCallback(
    (value: boolean) => dispatch({ type: 'SET_PAY_ADD_TO_BUDGET', value }),
    [],
  );
  const setPayCategory = useCallback((value: string) => dispatch({ type: 'SET_PAY_CATEGORY', value }), []);
  const setPaySaving = useCallback((value: boolean) => dispatch({ type: 'SET_PAY_SAVING', value }), []);

  const setStrategy = useCallback((strategy: DebtStrategy) => {
    dispatch({ type: 'SET_STRATEGY', strategy });
  }, []);

  const setExtraMonthly = useCallback((value: number | ((current: number) => number)) => {
    dispatch({ type: 'SET_EXTRA_MONTHLY', value });
  }, []);

  const setIsAiLoading = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_AI_LOADING', value });
  }, []);

  const applyHouseholdDefaults = useCallback((settings: DebtsSettings) => {
    dispatch({ type: 'APPLY_HOUSEHOLD_DEFAULTS', settings });
  }, []);

  const syncPayCategory = useCallback((categories: string[], pattern: string) => {
    dispatch({ type: 'SYNC_PAY_CATEGORY', categories, pattern });
  }, []);

  const value: DebtsUiContextValue = {
    ...state,
    openDebtForm,
    closeDebtForm,
    setName,
    setTargetAmount,
    setPaidAmount,
    setAnnualInterestRate,
    setMinimumPayment,
    setDueDay,
    openPayModal,
    closePayModal,
    setPayAmount,
    setPayDate,
    setPayNote,
    setPayAddToBudget,
    setPayCategory,
    setPaySaving,
    setStrategy,
    setExtraMonthly,
    setIsAiLoading,
    applyHouseholdDefaults,
    syncPayCategory,
  };

  return <DebtsUiContext.Provider value={value}>{children}</DebtsUiContext.Provider>;
}

export function useDebtsUi(): DebtsUiContextValue {
  const ctx = useContext(DebtsUiContext);
  if (!ctx) {
    throw new Error('useDebtsUi must be used within a <DebtsUiProvider>');
  }
  return ctx;
}
