import { create } from 'zustand';
import { CashTransaction } from '@/types';
import { aiFinanceClient } from '@/lib/api-client';
import { useAuthStore } from './useAuthStore';
import { useBudgetStore } from './useBudgetStore';

import { today } from '@/lib/dates';

const todayIso = today;

interface BudgetUiState {
  isTxModalOpen: boolean;
  editTxId: number | null;
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
  activeTxId: number | null;
  ledgerAmount: string;
  ledgerReason: string;

  manualBalance: string;
  balanceSaved: boolean;
  balanceSaving: boolean;

  setTxType: (type: 'expense' | 'income') => void;
  setTxCat: (cat: string) => void;
  setTxDesc: (desc: string) => void;
  setTxAmount: (amount: string) => void;
  setTxDue: (due: string) => void;
  setTxIsBudget: (value: boolean) => void;
  setTxIsReserve: (value: boolean) => void;
  setIsTxModalOpen: (open: boolean) => void;
  setLedgerAmount: (amount: string) => void;
  setLedgerReason: (reason: string) => void;
  setManualBalance: (value: string) => void;
  setBalanceSaved: (saved: boolean) => void;
  setActiveTxId: (id: number | null) => void;
  setIsLedgerModalOpen: (open: boolean) => void;

  syncManualBalanceFromDb: (value: number) => void;
  openTxForm: (tx: CashTransaction | null | undefined, defaultType?: 'income' | 'expense', categories?: string[]) => void;
  handleTxSubmit: (e: React.FormEvent) => void;
  handleAutoCategory: () => Promise<void>;
  handleManualBalanceSave: () => Promise<void>;
  handleLedgerSubmit: () => void;
  closeLedgerModal: () => void;
  openLedgerModal: (txId: number) => void;
}

export const useBudgetUiStore = create<BudgetUiState>((set, get) => ({
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

  manualBalance: '0',
  balanceSaved: false,
  balanceSaving: false,

  setTxType: (txType) => set({ txType }),
  setTxCat: (txCat) => set({ txCat }),
  setTxDesc: (txDesc) => set({ txDesc }),
  setTxAmount: (txAmount) => set({ txAmount }),
  setTxDue: (txDue) => set({ txDue }),
  setTxIsBudget: (txIsBudget) => set({ txIsBudget }),
  setTxIsReserve: (txIsReserve) => set({ txIsReserve }),
  setIsTxModalOpen: (isTxModalOpen) => set({ isTxModalOpen }),
  setLedgerAmount: (ledgerAmount) => set({ ledgerAmount }),
  setLedgerReason: (ledgerReason) => set({ ledgerReason }),
  setManualBalance: (manualBalance) => set({ manualBalance, balanceSaved: false }),
  setBalanceSaved: (balanceSaved) => set({ balanceSaved }),
  setActiveTxId: (activeTxId) => set({ activeTxId }),
  setIsLedgerModalOpen: (isLedgerModalOpen) => set({ isLedgerModalOpen }),

  syncManualBalanceFromDb: (value) => set({ manualBalance: value.toString() }),

  openTxForm: (tx, defaultType = 'expense', categories = useBudgetStore.getState().categories) => {
    if (tx) {
      set({
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
      });
    } else {
      set({
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
      });
    }
  },

  handleTxSubmit: (e) => {
    e.preventDefault();
    const {
      editTxId,
      txType,
      txDesc,
      txCat,
      txAmount,
      txDue,
      txIsBudget,
      txIsReserve,
      txPaidDate,
    } = get();
    const cleanAmount = txAmount.toString().replace(',', '.');
    const data = {
      type: txType,
      description: txDesc,
      category: txCat,
      amount: Number(cleanAmount),
      dueDate: txDue,
      isBudget: txIsBudget,
      isReserve: txIsReserve,
      paidDate: txPaidDate,
    };
    const { addTransaction, updateTransaction } = useBudgetStore.getState();
    if (editTxId) void updateTransaction(editTxId, data);
    else void addTransaction(data);
    set({ isTxModalOpen: false });
  },

  handleAutoCategory: async () => {
    const { txDesc, txType, txAmount } = get();
    if (!txDesc.trim()) return;
    const categories = useBudgetStore.getState().categories;
    set({ isCategoryLoading: true });
    try {
      const res = await aiFinanceClient.autoCategorizeTransaction({
        description: txDesc,
        type: txType,
        amount: txAmount ? Number(txAmount) : undefined,
        candidate_categories: categories,
      });
      const category = res.data?.data?.category;
      if (category) set({ txCat: category });
    } finally {
      set({ isCategoryLoading: false });
    }
  },

  handleManualBalanceSave: async () => {
    const { manualBalance } = get();
    set({ balanceSaving: true });
    try {
      await useAuthStore.getState().updateManualBalance(Number(manualBalance) || 0);
      set({ balanceSaved: true });
      window.setTimeout(() => set({ balanceSaved: false }), 2000);
    } finally {
      set({ balanceSaving: false });
    }
  },

  handleLedgerSubmit: () => {
    const { activeTxId, ledgerAmount, ledgerReason } = get();
    if (!activeTxId) return;
    const cleanAmount = ledgerAmount.replace(',', '.');
    const amt = -Math.abs(Number(cleanAmount));
    void useBudgetStore.getState().addSubItem(activeTxId, {
      date: todayIso(),
      amount: amt,
      reason: ledgerReason,
    });
    set({ ledgerAmount: '', ledgerReason: '' });
  },

  closeLedgerModal: () => set({ isLedgerModalOpen: false, activeTxId: null }),

  openLedgerModal: (txId) => set({ activeTxId: txId, isLedgerModalOpen: true }),
}));
