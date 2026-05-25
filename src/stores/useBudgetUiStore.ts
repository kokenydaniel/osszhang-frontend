import { create } from 'zustand';
import { CashTransaction, isSavingsGoalTransaction } from '@/types';
import { aiFinanceClient } from '@/lib/api-client';
import { canEditHousehold } from '@/lib/householdRole';
import { useAuthStore } from './useAuthStore';
import { useBudgetStore } from './useBudgetStore';
import { usePreferenceStore } from './usePreferenceStore';
import { getActiveWalletId } from './useWalletStore';

import { today } from '@/lib/dates';

const todayIso = today;

interface BudgetUiState {
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
  setActiveTxId: (id: number | string | null) => void;
  setIsLedgerModalOpen: (open: boolean) => void;

  syncManualBalanceFromDb: (value: number) => void;
  openTxForm: (tx: CashTransaction | null | undefined, defaultType?: 'income' | 'expense', categories?: string[]) => void;
  handleTxSubmit: (e: React.FormEvent) => void;
  handleAutoCategory: () => Promise<void>;
  handleManualBalanceSave: () => Promise<void>;
  handleLedgerSubmit: () => Promise<void>;
  closeLedgerModal: () => void;
  openLedgerModal: (txId: number | string) => void;
  openGoalPaymentModal: (goalRow: CashTransaction) => void;
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
  ledgerIsGoalPayment: false,
  ledgerGoalTitle: '',

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
    if (!canEditHousehold(useAuthStore.getState().user)) return;

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
    if (!canEditHousehold(useAuthStore.getState().user)) return;

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
    const walletId = getActiveWalletId() ?? undefined;
    const data = {
      type: txType,
      description: txDesc,
      category: txCat,
      amount: Number(cleanAmount),
      dueDate: txDue,
      isBudget: txIsBudget,
      isReserve: txIsReserve,
      paidDate: txPaidDate,
      walletId,
    };
    const { addTransaction, updateTransaction } = useBudgetStore.getState();
    if (editTxId !== null && typeof editTxId === 'number') void updateTransaction(editTxId, data);
    else void addTransaction(data);
    set({ isTxModalOpen: false });
  },

  handleAutoCategory: async () => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;

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
    if (!canEditHousehold(useAuthStore.getState().user)) return;

    const { manualBalance } = get();
    const walletId = getActiveWalletId();
    if (walletId === null) return;

    set({ balanceSaving: true });
    try {
      await useAuthStore.getState().updateWalletManualBalance(walletId, Number(manualBalance) || 0);
      set({ balanceSaved: true });
      window.setTimeout(() => set({ balanceSaved: false }), 2000);
    } finally {
      set({ balanceSaving: false });
    }
  },

  handleLedgerSubmit: async () => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;

    const { activeTxId, ledgerAmount, ledgerReason, ledgerIsGoalPayment } = get();
    if (activeTxId === null) return;
    const cleanAmount = ledgerAmount.replace(',', '.');
    const isGoal = ledgerIsGoalPayment || isSavingsGoalTransaction({ id: activeTxId });
    const { selectedMonth, selectedYear } = usePreferenceStore.getState();
    const monthDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const amt = isGoal ? Math.abs(Number(cleanAmount)) : -Math.abs(Number(cleanAmount));
    await useBudgetStore.getState().addSubItem(activeTxId, {
      date: isGoal ? monthDate : todayIso(),
      amount: amt,
      reason: ledgerReason || (isGoal ? 'Költségvetés – havi befizetés' : ''),
    });
    if (isGoal) {
      set({
        isLedgerModalOpen: false,
        activeTxId: null,
        ledgerIsGoalPayment: false,
        ledgerGoalTitle: '',
        ledgerAmount: '',
        ledgerReason: '',
      });
    } else {
      set({ ledgerAmount: '', ledgerReason: '' });
    }
  },

  closeLedgerModal: () =>
    set({
      isLedgerModalOpen: false,
      activeTxId: null,
      ledgerIsGoalPayment: false,
      ledgerGoalTitle: '',
      ledgerAmount: '',
      ledgerReason: '',
    }),

  openLedgerModal: (txId) => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;
    set({
      activeTxId: txId,
      isLedgerModalOpen: true,
      ledgerIsGoalPayment: false,
      ledgerGoalTitle: '',
      ledgerAmount: '',
      ledgerReason: '',
    });
  },

  openGoalPaymentModal: (goalRow) => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;
    const title = goalRow.description.replace(/^Cél:\s*/, '');
    const planned = goalRow.amount > 0 ? String(Math.round(goalRow.amount)) : '';
    set({
      activeTxId: goalRow.id,
      isLedgerModalOpen: true,
      ledgerIsGoalPayment: true,
      ledgerGoalTitle: title,
      ledgerAmount: planned,
      ledgerReason: `Költségvetés – ${title}`,
    });
  },
}));
