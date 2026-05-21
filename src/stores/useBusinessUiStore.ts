import { create } from 'zustand';
import { BusinessOrder } from '@/types';
import { aiFinanceClient } from '@/lib/api-client';
import {
  pickDefaultChannel,
  pickDefaultPayment,
  pickDefaultProvider,
  pickDefaultDestination,
  type BusinessSettings,
} from '@/lib/businessSettings';
import { useBusinessStore } from './useBusinessStore';

import { today } from '@/lib/dates';

const todayIso = today;

interface BusinessUiState {
  activeTab: 'monthly' | 'summary';
  isModalOpen: boolean;
  editId: number | null;
  isSyncing: boolean;
  realAiAdvice: string | null;
  isAiLoading: boolean;
  customer: string;
  amount: string;
  orderDate: string;
  channel: string;
  payment: string;
  provider: string;
  destination: string;
  paidDate: string;
  invoiceId: string;

  setActiveTab: (tab: 'monthly' | 'summary') => void;
  setIsModalOpen: (open: boolean) => void;
  setCustomer: (value: string) => void;
  setAmount: (value: string) => void;
  setOrderDate: (value: string) => void;
  setChannel: (value: string) => void;
  setPayment: (value: string) => void;
  setProvider: (value: string) => void;
  setDestination: (value: string) => void;
  setPaidDate: (value: string) => void;
  setInvoiceId: (value: string) => void;

  openForm: (order: BusinessOrder | undefined, bizOptions: BusinessSettings) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleShopifySync: () => Promise<void>;
  handleRequestAiAdvice: (prompt: string) => Promise<void>;
}

export const useBusinessUiStore = create<BusinessUiState>((set, get) => ({
  activeTab: 'monthly',
  isModalOpen: false,
  editId: null,
  isSyncing: false,
  realAiAdvice: null,
  isAiLoading: false,
  customer: '',
  amount: '',
  orderDate: todayIso(),
  channel: '',
  payment: '',
  provider: '',
  destination: '',
  paidDate: '',
  invoiceId: '',

  setActiveTab: (activeTab) => set({ activeTab }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setCustomer: (customer) => set({ customer }),
  setAmount: (amount) => set({ amount }),
  setOrderDate: (orderDate) => set({ orderDate }),
  setChannel: (channel) => set({ channel }),
  setPayment: (payment) => set({ payment }),
  setProvider: (provider) => set({ provider }),
  setDestination: (destination) => set({ destination }),
  setPaidDate: (paidDate) => set({ paidDate }),
  setInvoiceId: (invoiceId) => set({ invoiceId }),

  openForm: (order, bizOptions) => {
    if (order) {
      set({
        editId: order.id,
        customer: order.customerName || '',
        amount: String(order.amount || ''),
        orderDate: order.date || todayIso(),
        channel: order.channel || pickDefaultChannel(bizOptions),
        payment: order.paymentMethod || pickDefaultPayment(bizOptions),
        provider: order.provider || pickDefaultProvider(bizOptions),
        destination: order.destination || pickDefaultDestination(bizOptions),
        paidDate: order.paidDate || '',
        invoiceId: order.invoiceId || '',
        isModalOpen: true,
      });
    } else {
      set({
        editId: null,
        customer: '',
        amount: '',
        orderDate: todayIso(),
        channel: pickDefaultChannel(bizOptions),
        payment: pickDefaultPayment(bizOptions),
        provider: pickDefaultProvider(bizOptions),
        destination: pickDefaultDestination(bizOptions),
        paidDate: '',
        invoiceId: '',
        isModalOpen: true,
      });
    }
  },

  handleSubmit: (e) => {
    e.preventDefault();
    const {
      editId,
      customer,
      amount,
      orderDate,
      channel,
      payment,
      provider,
      destination,
      paidDate,
      invoiceId,
    } = get();
    if (!amount || !customer) return;
    const payload = {
      date: orderDate,
      customerName: customer,
      channel,
      paymentMethod: payment,
      provider,
      destination,
      amount: Number(amount),
      paidDate: paidDate || null,
      invoiceId,
      state: (paidDate ? 'RENDBEN' : 'KINT') as 'RENDBEN' | 'KINT',
    };
    const { addOrder, updateOrder } = useBusinessStore.getState();
    if (editId) void updateOrder(editId, payload);
    else void addOrder(payload);
    set({ isModalOpen: false });
  },

  handleShopifySync: async () => {
    set({ isSyncing: true });
    try {
      await useBusinessStore.getState().shopifyImport();
    } catch (err) {
      console.error(err);
    } finally {
      set({ isSyncing: false });
    }
  },

  handleRequestAiAdvice: async (prompt) => {
    set({ isAiLoading: true });
    try {
      const response = await aiFinanceClient.query(prompt, false);
      set({ realAiAdvice: response.data.answer });
    } catch (error) {
      console.error('Failed to get AI advice', error);
      set({ realAiAdvice: 'Sajnos nem sikerült elérni az AI szolgáltatást. Kérlek próbáld újra később.' });
    } finally {
      set({ isAiLoading: false });
    }
  },
}));
