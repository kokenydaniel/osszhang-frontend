import { create } from 'zustand';
import { getCurrentMonth, getCurrentYear } from '@/utils/dates';

type PeriodState = {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
};

export const usePeriodStore = create<PeriodState>((set) => ({
  selectedMonth: getCurrentMonth(),
  selectedYear: getCurrentYear(),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setSelectedYear: (selectedYear) => set({ selectedYear }),
}));
