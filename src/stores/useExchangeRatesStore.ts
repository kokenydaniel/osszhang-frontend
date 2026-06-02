import { create } from 'zustand';

type ExchangeRatesState = {
  rates: Record<string, number>;
  setRates: (rates: Record<string, number>) => void;
};

export const useExchangeRatesStore = create<ExchangeRatesState>((set) => ({
  rates: {},
  setRates: (rates) => set({ rates }),
}));
