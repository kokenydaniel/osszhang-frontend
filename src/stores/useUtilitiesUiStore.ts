import { create } from 'zustand';
import { UtilityBill, UtilitySplitRule } from '@/types';
import { useUtilitiesStore } from './useUtilitiesStore';

import { today } from '@/lib/dates';

const todayIso = today;

interface UtilitiesUiState {
  isModalOpen: boolean;
  editingBill: UtilityBill | null;
  type: string;
  total: string;
  dueDate: string;
  splitRule: UtilitySplitRule;

  setType: (type: string) => void;
  setTotal: (total: string) => void;
  setDueDate: (dueDate: string) => void;
  setSplitRule: (rule: UtilitySplitRule) => void;
  setIsModalOpen: (open: boolean) => void;

  openNewBillModal: () => void;
  handleEdit: (bill: UtilityBill) => void;
  resetBillForm: () => void;
  handleSubmit: (
    e: React.FormEvent,
    options: {
      isReader: boolean;
      utilitySplitEnabled: boolean;
    },
  ) => void;
}

export const useUtilitiesUiStore = create<UtilitiesUiState>((set, get) => ({
  isModalOpen: false,
  editingBill: null,
  type: '',
  total: '',
  dueDate: todayIso(),
  splitRule: 'shared',

  setType: (type) => set({ type }),
  setTotal: (total) => set({ total }),
  setDueDate: (dueDate) => set({ dueDate }),
  setSplitRule: (splitRule) => set({ splitRule }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),

  resetBillForm: () =>
    set({
      editingBill: null,
      type: '',
      total: '',
      dueDate: todayIso(),
      splitRule: 'shared',
    }),

  openNewBillModal: () => {
    set({
      editingBill: null,
      isModalOpen: true,
    });
  },

  handleEdit: (bill) => {
    set({
      editingBill: bill,
      type: bill.type,
      total: bill.total.toString(),
      dueDate: bill.dueDate,
      splitRule: bill.splitRule,
      isModalOpen: true,
    });
  },

  handleSubmit: (e, { isReader, utilitySplitEnabled }) => {
    e.preventDefault();
    if (isReader) return;
    const { total, type, dueDate, splitRule, editingBill } = get();
    if (!total) return;

    const { addBill, updateBill } = useUtilitiesStore.getState();
    const targetSplitRule = utilitySplitEnabled ? splitRule : ('dani-private' as UtilitySplitRule);

    if (editingBill) {
      void updateBill(editingBill.id, { type, total: Number(total), dueDate, splitRule: targetSplitRule });
    } else {
      void addBill({ type, total: Number(total), dueDate, paidDate: null, paidBy: null, splitRule: targetSplitRule });
    }

    set({ isModalOpen: false });
    get().resetBillForm();
  },
}));
