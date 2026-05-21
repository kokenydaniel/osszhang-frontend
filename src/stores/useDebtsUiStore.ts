import { create } from 'zustand';
import { Debt } from '@/types';
import { formatHUF } from '@/utils';
import { matchPaymentCategory, resolveDebtsSettings } from '@/lib/debtsSettings';
import { useAuthStore } from './useAuthStore';
import { useBudgetStore } from './useBudgetStore';
import { useDebtsStore } from './useDebtsStore';
import { useNotificationStore } from './useNotificationStore';

export type DebtStrategy = 'avalanche' | 'snowball';

import { today } from '@/lib/dates';

const todayIso = today;

interface DebtsUiState {
  isModalOpen: boolean;
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

  setName: (name: string) => void;
  setTargetAmount: (value: string) => void;
  setPaidAmount: (value: string) => void;
  setAnnualInterestRate: (value: string) => void;
  setMinimumPayment: (value: string) => void;
  setDueDay: (value: string) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsPayModalOpen: (open: boolean) => void;
  setPayAmount: (value: string) => void;
  setPayDate: (value: string) => void;
  setPayNote: (value: string) => void;
  setPayAddToBudget: (value: boolean) => void;
  setPayCategory: (value: string) => void;
  setStrategy: (strategy: DebtStrategy) => void;
  setExtraMonthly: (value: number | ((current: number) => number)) => void;

  applyHouseholdDefaults: () => void;
  syncPayCategory: (categories: string[]) => void;
  openForm: (debt?: Debt) => void;
  handleSubmit: (e: React.FormEvent) => void;
  openPayModal: (debt: Debt) => void;
  handlePaySubmit: (e: React.FormEvent) => Promise<void>;
  handleAiOptimize: () => Promise<void>;
}

function getDebtsSettings() {
  const household = useAuthStore.getState().user?.household;
  return resolveDebtsSettings(household);
}

export const useDebtsUiStore = create<DebtsUiState>((set, get) => ({
  isModalOpen: false,
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
  payDate: todayIso(),
  payNote: '',
  payAddToBudget: getDebtsSettings().pay_add_to_budget_default,
  payCategory: '',
  paySaving: false,

  strategy: getDebtsSettings().default_strategy,
  isAiLoading: false,
  extraMonthly: getDebtsSettings().default_extra_monthly,

  setName: (name) => set({ name }),
  setTargetAmount: (targetAmount) => set({ targetAmount }),
  setPaidAmount: (paidAmount) => set({ paidAmount }),
  setAnnualInterestRate: (annualInterestRate) => set({ annualInterestRate }),
  setMinimumPayment: (minimumPayment) => set({ minimumPayment }),
  setDueDay: (dueDay) => set({ dueDay }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setIsPayModalOpen: (isPayModalOpen) => set({ isPayModalOpen }),
  setPayAmount: (payAmount) => set({ payAmount }),
  setPayDate: (payDate) => set({ payDate }),
  setPayNote: (payNote) => set({ payNote }),
  setPayAddToBudget: (payAddToBudget) => set({ payAddToBudget }),
  setPayCategory: (payCategory) => set({ payCategory }),
  setStrategy: (strategy) => set({ strategy }),
  setExtraMonthly: (value) =>
    set((state) => ({
      extraMonthly: typeof value === 'function' ? value(state.extraMonthly) : value,
    })),

  applyHouseholdDefaults: () => {
    const settings = getDebtsSettings();
    set({
      strategy: settings.default_strategy,
      extraMonthly: settings.default_extra_monthly,
      payAddToBudget: settings.pay_add_to_budget_default,
    });
  },

  syncPayCategory: (categories) => {
    if (categories.length === 0) return;
    const settings = getDebtsSettings();
    const def = matchPaymentCategory(categories, settings.payment_category_pattern);
    set((state) => ({ payCategory: state.payCategory || def }));
  },

  openForm: (debt) => {
    if (debt) {
      set({
        editId: debt.id,
        name: debt.name,
        targetAmount: String(debt.targetAmount),
        paidAmount: String(debt.paidAmount),
        annualInterestRate: debt.annualInterestRate ? String(debt.annualInterestRate) : '',
        minimumPayment: debt.minimumPayment ? String(debt.minimumPayment) : '',
        dueDay: debt.dueDay ? String(debt.dueDay) : '',
        isModalOpen: true,
      });
    } else {
      set({
        editId: null,
        name: '',
        targetAmount: '',
        paidAmount: '0',
        annualInterestRate: '',
        minimumPayment: '',
        dueDay: '',
        isModalOpen: true,
      });
    }
  },

  handleSubmit: (e) => {
    e.preventDefault();
    const { editId, name, targetAmount, paidAmount, annualInterestRate, minimumPayment, dueDay } = get();
    const data = {
      name,
      targetAmount: Number(targetAmount),
      paidAmount: Number(paidAmount) || 0,
      annualInterestRate: annualInterestRate ? Number(annualInterestRate) : null,
      minimumPayment: minimumPayment ? Number(minimumPayment) : null,
      dueDay: dueDay ? Number(dueDay) : null,
      status: (Number(paidAmount) >= Number(targetAmount) ? 'Maradt' : 'Van még') as Debt['status'],
    };
    const { addDebt, updateDebt } = useDebtsStore.getState();
    if (editId) void updateDebt(editId, data);
    else void addDebt(data);
    set({ isModalOpen: false });
  },

  openPayModal: (debt) => {
    const settings = getDebtsSettings();
    const categories = useBudgetStore.getState().categories;
    set({
      payDebt: debt,
      payAmount: debt.minimumPayment ? String(debt.minimumPayment) : '',
      payDate: todayIso(),
      payNote: `${debt.name} törlesztés`,
      payAddToBudget: settings.pay_add_to_budget_default,
      payCategory:
        categories.length > 0
          ? matchPaymentCategory(categories, settings.payment_category_pattern)
          : get().payCategory,
      isPayModalOpen: true,
    });
  },

  handlePaySubmit: async (e) => {
    e.preventDefault();
    const { payDebt, payAmount, payDate, payNote, payAddToBudget, payCategory } = get();
    if (!payDebt) return;
    const amt = Number(String(payAmount).replace(',', '.'));
    if (!(amt > 0)) {
      useNotificationStore.getState().addNotification('Adj meg egy érvényes pozitív összeget.', 'error');
      return;
    }
    set({ paySaving: true });
    try {
      const newPaid = Number(payDebt.paidAmount) + amt;
      const completed = newPaid >= Number(payDebt.targetAmount);
      await useDebtsStore.getState().updateDebt(payDebt.id, {
        paidAmount: newPaid,
        status: (completed ? 'Maradt' : 'Van még') as Debt['status'],
      });
      if (payAddToBudget && payCategory) {
        await useBudgetStore.getState().addTransaction({
          type: 'expense',
          description: payNote || `${payDebt.name} törlesztés`,
          category: payCategory,
          amount: amt,
          dueDate: payDate,
          paidDate: payDate,
          isBudget: false,
          isReserve: false,
        });
      }
      useNotificationStore.getState().addNotification(
        `${formatHUF(amt)} törlesztés rögzítve${payAddToBudget ? ' (költségvetésben is)' : ''}.`,
        'success',
      );
      set({ isPayModalOpen: false });
    } catch (err) {
      console.error(err);
      useNotificationStore.getState().addNotification('Nem sikerült rögzíteni a törlesztést.', 'error');
    } finally {
      set({ paySaving: false });
    }
  },

  handleAiOptimize: async () => {
    const { strategy } = get();
    set({ isAiLoading: true });
    try {
      await useDebtsStore.getState().fetchAiDebtPlan(strategy);
    } finally {
      set({ isAiLoading: false });
    }
  },
}));
