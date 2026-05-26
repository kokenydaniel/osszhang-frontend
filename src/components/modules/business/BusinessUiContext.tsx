'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import { today } from '@/lib/dates';
import type { BusinessOrder } from '@/types/business';
import {
  pickDefaultChannel,
  pickDefaultDestination,
  pickDefaultPayment,
  pickDefaultProvider,
  type BusinessSettings,
} from '@/lib/businessSettings';
import { canEditHousehold } from '@/lib/householdRole';
import { useAuthStore } from '@/stores/useAuthStore';

interface BusinessUiState {
  activeTab: 'monthly' | 'summary';
  isModalOpen: boolean;
  editId: number | null;
  customer: string;
  amount: string;
  orderDate: string;
  channel: string;
  payment: string;
  provider: string;
  destination: string;
  paidDate: string;
  invoiceId: string;
  isSyncing: boolean;
  isAiLoading: boolean;
  realAiAdvice: string | null;
}

interface BusinessUiActions {
  setActiveTab: (tab: 'monthly' | 'summary') => void;
  openOrderForm: (order: BusinessOrder | undefined, bizOptions: BusinessSettings) => void;
  closeOrderForm: () => void;
  setCustomer: (value: string) => void;
  setAmount: (value: string) => void;
  setOrderDate: (value: string) => void;
  setChannel: (value: string) => void;
  setPayment: (value: string) => void;
  setProvider: (value: string) => void;
  setDestination: (value: string) => void;
  setPaidDate: (value: string) => void;
  setInvoiceId: (value: string) => void;
  setIsSyncing: (value: boolean) => void;
  setIsAiLoading: (value: boolean) => void;
  setRealAiAdvice: (value: string | null) => void;
}

export type BusinessUiContextValue = BusinessUiState & BusinessUiActions;

type BusinessUiAction =
  | { type: 'SET_ACTIVE_TAB'; tab: 'monthly' | 'summary' }
  | { type: 'OPEN_ORDER_FORM'; order?: BusinessOrder; bizOptions: BusinessSettings }
  | { type: 'CLOSE_ORDER_FORM' }
  | { type: 'SET_CUSTOMER'; value: string }
  | { type: 'SET_AMOUNT'; value: string }
  | { type: 'SET_ORDER_DATE'; value: string }
  | { type: 'SET_CHANNEL'; value: string }
  | { type: 'SET_PAYMENT'; value: string }
  | { type: 'SET_PROVIDER'; value: string }
  | { type: 'SET_DESTINATION'; value: string }
  | { type: 'SET_PAID_DATE'; value: string }
  | { type: 'SET_INVOICE_ID'; value: string }
  | { type: 'SET_IS_SYNCING'; value: boolean }
  | { type: 'SET_IS_AI_LOADING'; value: boolean }
  | { type: 'SET_REAL_AI_ADVICE'; value: string | null };

const INITIAL_UI_STATE: BusinessUiState = {
  activeTab: 'monthly',
  isModalOpen: false,
  editId: null,
  customer: '',
  amount: '',
  orderDate: today(),
  channel: '',
  payment: '',
  provider: '',
  destination: '',
  paidDate: '',
  invoiceId: '',
  isSyncing: false,
  isAiLoading: false,
  realAiAdvice: null,
};

function businessUiReducer(state: BusinessUiState, action: BusinessUiAction): BusinessUiState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };

    case 'OPEN_ORDER_FORM':
      if (action.order) {
        return {
          ...state,
          editId: action.order.id,
          customer: action.order.customerName || '',
          amount: String(action.order.amount || ''),
          orderDate: action.order.date || today(),
          channel: action.order.channel || pickDefaultChannel(action.bizOptions),
          payment: action.order.paymentMethod || pickDefaultPayment(action.bizOptions),
          provider: action.order.provider || pickDefaultProvider(action.bizOptions),
          destination: action.order.destination || pickDefaultDestination(action.bizOptions),
          paidDate: action.order.paidDate || '',
          invoiceId: action.order.invoiceId || '',
          isModalOpen: true,
        };
      }
      return {
        ...state,
        editId: null,
        customer: '',
        amount: '',
        orderDate: today(),
        channel: pickDefaultChannel(action.bizOptions),
        payment: pickDefaultPayment(action.bizOptions),
        provider: pickDefaultProvider(action.bizOptions),
        destination: pickDefaultDestination(action.bizOptions),
        paidDate: '',
        invoiceId: '',
        isModalOpen: true,
      };

    case 'CLOSE_ORDER_FORM':
      return { ...state, isModalOpen: false, editId: null };

    case 'SET_CUSTOMER':
      return { ...state, customer: action.value };
    case 'SET_AMOUNT':
      return { ...state, amount: action.value };
    case 'SET_ORDER_DATE':
      return { ...state, orderDate: action.value };
    case 'SET_CHANNEL':
      return { ...state, channel: action.value };
    case 'SET_PAYMENT':
      return { ...state, payment: action.value };
    case 'SET_PROVIDER':
      return { ...state, provider: action.value };
    case 'SET_DESTINATION':
      return { ...state, destination: action.value };
    case 'SET_PAID_DATE':
      return { ...state, paidDate: action.value };
    case 'SET_INVOICE_ID':
      return { ...state, invoiceId: action.value };
    case 'SET_IS_SYNCING':
      return { ...state, isSyncing: action.value };
    case 'SET_IS_AI_LOADING':
      return { ...state, isAiLoading: action.value };
    case 'SET_REAL_AI_ADVICE':
      return { ...state, realAiAdvice: action.value };

    default:
      return state;
  }
}

const BusinessUiContext = createContext<BusinessUiContextValue | null>(null);

export function BusinessUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(businessUiReducer, INITIAL_UI_STATE);

  const setActiveTab = useCallback((tab: 'monthly' | 'summary') => {
    dispatch({ type: 'SET_ACTIVE_TAB', tab });
  }, []);

  const openOrderForm = useCallback((order: BusinessOrder | undefined, bizOptions: BusinessSettings) => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;
    dispatch({ type: 'OPEN_ORDER_FORM', order, bizOptions });
  }, []);

  const closeOrderForm = useCallback(() => {
    dispatch({ type: 'CLOSE_ORDER_FORM' });
  }, []);

  const setCustomer = useCallback((value: string) => dispatch({ type: 'SET_CUSTOMER', value }), []);
  const setAmount = useCallback((value: string) => dispatch({ type: 'SET_AMOUNT', value }), []);
  const setOrderDate = useCallback((value: string) => dispatch({ type: 'SET_ORDER_DATE', value }), []);
  const setChannel = useCallback((value: string) => dispatch({ type: 'SET_CHANNEL', value }), []);
  const setPayment = useCallback((value: string) => dispatch({ type: 'SET_PAYMENT', value }), []);
  const setProvider = useCallback((value: string) => dispatch({ type: 'SET_PROVIDER', value }), []);
  const setDestination = useCallback((value: string) => dispatch({ type: 'SET_DESTINATION', value }), []);
  const setPaidDate = useCallback((value: string) => dispatch({ type: 'SET_PAID_DATE', value }), []);
  const setInvoiceId = useCallback((value: string) => dispatch({ type: 'SET_INVOICE_ID', value }), []);
  const setIsSyncing = useCallback((value: boolean) => dispatch({ type: 'SET_IS_SYNCING', value }), []);
  const setIsAiLoading = useCallback((value: boolean) => dispatch({ type: 'SET_IS_AI_LOADING', value }), []);
  const setRealAiAdvice = useCallback((value: string | null) => dispatch({ type: 'SET_REAL_AI_ADVICE', value }), []);

  const value: BusinessUiContextValue = {
    ...state,
    setActiveTab,
    openOrderForm,
    closeOrderForm,
    setCustomer,
    setAmount,
    setOrderDate,
    setChannel,
    setPayment,
    setProvider,
    setDestination,
    setPaidDate,
    setInvoiceId,
    setIsSyncing,
    setIsAiLoading,
    setRealAiAdvice,
  };

  return <BusinessUiContext.Provider value={value}>{children}</BusinessUiContext.Provider>;
}

export function useBusinessUi(): BusinessUiContextValue {
  const ctx = useContext(BusinessUiContext);
  if (!ctx) {
    throw new Error('useBusinessUi must be used within a <BusinessUiProvider>');
  }
  return ctx;
}
