import { create } from 'zustand';
import type { AiUtilityAnomalies } from '@/types';
import type { UtilitiesIndex } from '@/mappers/utilities.mapper';
import type { UtilityBill, UtilitySettlement } from '@/types';

interface UtilitiesState {
  bills: UtilityBill[];
  settlements: UtilitySettlement[];
  aiUtilityAnomalies: AiUtilityAnomalies | null;
  isLoading: boolean;
  isLoaded: boolean;

  setUtilities: (data: UtilitiesIndex) => void;
  setBills: (bills: UtilityBill[]) => void;
  setSettlements: (settlements: UtilitySettlement[]) => void;
  setAiUtilityAnomalies: (data: AiUtilityAnomalies | null) => void;
  setLoading: (loading: boolean) => void;
  setLoaded: (loaded: boolean) => void;
  patchBill: (id: number, updated: UtilityBill) => void;
  appendBill: (bill: UtilityBill) => void;
  removeBill: (id: number) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  bills: [] as UtilityBill[],
  settlements: [] as UtilitySettlement[],
  aiUtilityAnomalies: null as AiUtilityAnomalies | null,
  isLoading: false,
  isLoaded: false,
};

export const useUtilitiesStore = create<UtilitiesState>((set) => ({
  ...INITIAL_STATE,

  setUtilities: ({ bills, settlements }) => set({ bills, settlements, isLoading: false, isLoaded: true }),
  setBills: (bills) => set({ bills }),
  setSettlements: (settlements) => set({ settlements }),
  setAiUtilityAnomalies: (aiUtilityAnomalies) => set({ aiUtilityAnomalies }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  patchBill: (id, updated) =>
    set((state) => ({
      bills: state.bills.map((bill) => (bill.id === id ? updated : bill)),
    })),
  appendBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
  removeBill: (id) => set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })),
  reset: () => set(INITIAL_STATE),
}));
