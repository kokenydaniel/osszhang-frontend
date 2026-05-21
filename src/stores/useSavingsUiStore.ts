import { create } from 'zustand';
import { Investment, LedgerEntry } from '@/types';
import { useSavingsStore } from './useSavingsStore';

import { today } from '@/lib/dates';

const todayIso = today;

interface SavingsUiState {
  isLedgerModalOpen: boolean;
  selectedSavings: number | null;
  ledgerType: 'deposit' | 'withdraw';
  ledgerAmount: string;
  ledgerReason: string;
  ledgerDate: string;
  editingLedgerId: number | null;

  isNewAssetModalOpen: boolean;
  newAssetInitialKind: 'account' | 'investment';

  editingInvId: number | null;
  editingInvValue: string;
  editingPayoutInvId: number | null;
  editingPayoutAmount: string;
  editingPayoutDate: string;

  setLedgerType: (type: 'deposit' | 'withdraw') => void;
  setLedgerAmount: (value: string) => void;
  setLedgerReason: (value: string) => void;
  setLedgerDate: (value: string) => void;
  setIsNewAssetModalOpen: (open: boolean) => void;
  setEditingInvValue: (value: string) => void;
  setEditingPayoutInvId: (id: number | null) => void;
  setEditingPayoutAmount: (value: string) => void;
  setEditingPayoutDate: (value: string) => void;

  clearLedgerForm: () => void;
  closeLedgerModal: () => void;
  openLedgerModal: (accId: number) => void;
  startEditLedger: (item: LedgerEntry) => void;
  handleLedgerSubmit: () => Promise<void>;
  openNewAsset: (kind?: 'account' | 'investment') => void;
  startEditInvestmentValue: (inv: Investment, totalValue: number) => void;
  saveInvestmentValue: (invId: number) => void;
  cancelEditInvestmentValue: () => void;
  saveInvestmentPayout: (invId: number) => void;
}

export const useSavingsUiStore = create<SavingsUiState>((set, get) => ({
  isLedgerModalOpen: false,
  selectedSavings: null,
  ledgerType: 'deposit',
  ledgerAmount: '',
  ledgerReason: '',
  ledgerDate: todayIso(),
  editingLedgerId: null,

  isNewAssetModalOpen: false,
  newAssetInitialKind: 'account',

  editingInvId: null,
  editingInvValue: '',
  editingPayoutInvId: null,
  editingPayoutAmount: '',
  editingPayoutDate: '',

  setLedgerType: (ledgerType) => set({ ledgerType }),
  setLedgerAmount: (ledgerAmount) => set({ ledgerAmount }),
  setLedgerReason: (ledgerReason) => set({ ledgerReason }),
  setLedgerDate: (ledgerDate) => set({ ledgerDate }),
  setIsNewAssetModalOpen: (isNewAssetModalOpen) => set({ isNewAssetModalOpen }),
  setEditingInvValue: (editingInvValue) => set({ editingInvValue }),
  setEditingPayoutInvId: (editingPayoutInvId) => set({ editingPayoutInvId }),
  setEditingPayoutAmount: (editingPayoutAmount) => set({ editingPayoutAmount }),
  setEditingPayoutDate: (editingPayoutDate) => set({ editingPayoutDate }),

  clearLedgerForm: () =>
    set({
      ledgerAmount: '',
      ledgerReason: '',
      ledgerDate: todayIso(),
      ledgerType: 'deposit',
      editingLedgerId: null,
    }),

  closeLedgerModal: () => {
    get().clearLedgerForm();
    set({ isLedgerModalOpen: false, selectedSavings: null });
  },

  openLedgerModal: (accId) => {
    get().clearLedgerForm();
    set({ selectedSavings: accId, isLedgerModalOpen: true });
  },

  startEditLedger: (item) => {
    set({
      editingLedgerId: item.id,
      ledgerAmount: String(Math.abs(item.amount)),
      ledgerType: item.amount >= 0 ? 'deposit' : 'withdraw',
      ledgerReason: item.reason,
      ledgerDate: item.date,
    });
  },

  handleLedgerSubmit: async () => {
    const { selectedSavings, ledgerAmount, ledgerType, ledgerReason, ledgerDate, editingLedgerId } = get();
    if (!selectedSavings) return;
    const cleanAmount = ledgerAmount.replace(',', '.');
    const amt = ledgerType === 'deposit' ? Number(cleanAmount) : -Number(cleanAmount);
    const { addLedgerEntry, updateLedgerEntry } = useSavingsStore.getState();
    if (editingLedgerId) {
      await updateLedgerEntry(selectedSavings, editingLedgerId, {
        date: ledgerDate,
        amount: amt,
        reason: ledgerReason,
      });
    } else {
      await addLedgerEntry(selectedSavings, {
        date: ledgerDate,
        amount: amt,
        reason: ledgerReason,
      });
    }
    get().clearLedgerForm();
  },

  openNewAsset: (kind = 'account') => set({ newAssetInitialKind: kind, isNewAssetModalOpen: true }),

  startEditInvestmentValue: (inv, totalValue) => {
    set({
      editingInvId: inv.id,
      editingInvValue: inv.currentValue ? String(inv.currentValue) : Math.round(totalValue).toString(),
    });
  },

  saveInvestmentValue: (invId) => {
    const { editingInvValue } = get();
    void useSavingsStore.getState().updateInvestment(invId, { currentValue: Number(editingInvValue) });
    set({ editingInvId: null });
  },

  cancelEditInvestmentValue: () => set({ editingInvId: null }),

  saveInvestmentPayout: (invId) => {
    const { editingPayoutAmount, editingPayoutDate } = get();
    void useSavingsStore.getState().updateInvestment(invId, {
      nextPayoutAmount: Number(editingPayoutAmount),
      nextPayoutDate: editingPayoutDate || null,
    });
    set({ editingPayoutInvId: null });
  },
}));
