'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { today as todayIso } from '@/lib/dates';
import { CashTransaction } from '@/types';

export interface BudgetUiState {
  isTxModalOpen: boolean;
  editTxId: number | string | null;
  txType: 'expense' | 'income';
  txCat: string;
  txDesc: string;
  txAmount: string;
  txDue: string;
  txIsBudget: boolean;
  txIsReserve: boolean;
  txPaidDate: string | null;
  isCategoryLoading: boolean;

  isLedgerModalOpen: boolean;
  activeTxId: number | string | null;
  ledgerAmount: string;
  ledgerReason: string;
  ledgerIsGoalPayment: boolean;
  ledgerGoalTitle: string;

  manualBalance: string;
  balanceSaved: boolean;
  balanceSaving: boolean;
}

type Action =
  | { type: 'SET_TX_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_LEDGER_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_TX_FIELD'; field: keyof BudgetUiState; value: any }
  | { type: 'SET_LEDGER_FIELD'; field: keyof BudgetUiState; value: any }
  | { type: 'SET_MANUAL_BALANCE_STATE'; field: keyof BudgetUiState; value: any }
  | { type: 'OPEN_TX_FORM'; payload: { tx?: CashTransaction | null; defaultType?: 'income' | 'expense'; categories?: string[] } }
  | { type: 'OPEN_LEDGER_MODAL'; payload: { txId: number | string } }
  | { type: 'OPEN_GOAL_PAYMENT_MODAL'; payload: { goalRow: CashTransaction } }
  | { type: 'CLOSE_LEDGER_MODAL' };

const initialState: BudgetUiState = {
  isTxModalOpen: false,
  editTxId: null,
  txType: 'income',
  txCat: '',
  txDesc: '',
  txAmount: '',
  txDue: todayIso(),
  txIsBudget: false,
  txIsReserve: false,
  txPaidDate: null,
  isCategoryLoading: false,

  isLedgerModalOpen: false,
  activeTxId: null,
  ledgerAmount: '',
  ledgerReason: '',
  ledgerIsGoalPayment: false,
  ledgerGoalTitle: '',

  manualBalance: '0',
  balanceSaved: false,
  balanceSaving: false,
};

function reducer(state: BudgetUiState, action: Action): BudgetUiState {
  switch (action.type) {
    case 'SET_TX_MODAL_OPEN':
      return { ...state, isTxModalOpen: action.payload };
    case 'SET_LEDGER_MODAL_OPEN':
      return { ...state, isLedgerModalOpen: action.payload };
    case 'SET_TX_FIELD':
    case 'SET_LEDGER_FIELD':
    case 'SET_MANUAL_BALANCE_STATE':
      if (state[action.field] === action.value) return state;
      return { ...state, [action.field]: action.value };
    case 'OPEN_TX_FORM': {
      const { tx, defaultType = 'expense', categories = [] } = action.payload;
      if (tx) {
        return {
          ...state,
          editTxId: tx.id,
          txType: tx.type,
          txCat: tx.category,
          txDesc: tx.description,
          txAmount: tx.amount.toString(),
          txDue: tx.dueDate,
          txIsBudget: tx.isBudget || false,
          txIsReserve: tx.isReserve || false,
          txPaidDate: tx.paidDate || null,
          isTxModalOpen: true,
        };
      }
      return {
        ...state,
        editTxId: null,
        txType: defaultType,
        txCat: categories[0] || '',
        txDesc: '',
        txAmount: '',
        txDue: todayIso(),
        txIsBudget: false,
        txIsReserve: false,
        txPaidDate: null,
        isTxModalOpen: true,
      };
    }
    case 'OPEN_LEDGER_MODAL':
      return {
        ...state,
        activeTxId: action.payload.txId,
        isLedgerModalOpen: true,
        ledgerIsGoalPayment: false,
        ledgerGoalTitle: '',
        ledgerAmount: '',
        ledgerReason: '',
      };
    case 'OPEN_GOAL_PAYMENT_MODAL': {
      const { goalRow } = action.payload;
      const title = goalRow.description.replace(/^Cél:\s*/, '');
      const planned = goalRow.amount > 0 ? String(Math.round(goalRow.amount)) : '';
      return {
        ...state,
        activeTxId: goalRow.id,
        isLedgerModalOpen: true,
        ledgerIsGoalPayment: true,
        ledgerGoalTitle: title,
        ledgerAmount: planned,
        ledgerReason: `Költségvetés – ${title}`,
      };
    }
    case 'CLOSE_LEDGER_MODAL':
      return {
        ...state,
        isLedgerModalOpen: false,
        activeTxId: null,
        ledgerIsGoalPayment: false,
        ledgerGoalTitle: '',
        ledgerAmount: '',
        ledgerReason: '',
      };
    default:
      return state;
  }
}

export type BudgetUiContextValue = BudgetUiState & {
  dispatch: React.Dispatch<Action>;
};

const BudgetUiContext = createContext<BudgetUiContextValue | undefined>(undefined);

export function BudgetUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <BudgetUiContext.Provider value={{ ...state, dispatch }}>
      {children}
    </BudgetUiContext.Provider>
  );
}

export function useBudgetUi() {
  const context = useContext(BudgetUiContext);
  if (!context) {
    throw new Error('useBudgetUi must be used within a BudgetUiProvider');
  }
  return context;
}
