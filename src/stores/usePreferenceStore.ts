import { create } from 'zustand';

interface PreferenceState {
  selectedMonth: number;
  selectedYear: number;
  userPreferences: {
    currency: string;
    notificationsEnabled: boolean;
  };
  exchangeRates: Record<string, number>;

  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  updatePreferences: (p: Partial<PreferenceState['userPreferences']>) => Promise<void>;
  refreshRates: () => Promise<void>;
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  userPreferences: {
    currency: 'HUF',
    notificationsEnabled: true,
  },
  exchangeRates: {},

  setSelectedMonth: (m) => set({ selectedMonth: m }),
  setSelectedYear: (y) => set({ selectedYear: y }),
  
  updatePreferences: async (p) => {
    set({ userPreferences: { ...get().userPreferences, ...p } });
  },

  refreshRates: async () => {
    try {
      const [fiatRes, cryptoRes] = await Promise.all([
        fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json()),
        fetch('https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH&tsyms=HUF').then(r => r.json())
      ]);

      const usdToHuf = fiatRes.rates?.HUF || 365;
      const eurToHuf = fiatRes.rates?.HUF && fiatRes.rates?.EUR ? (fiatRes.rates.HUF / fiatRes.rates.EUR) : 395;
      const btcToHuf = cryptoRes.BTC?.HUF || 24000000;
      const ethToHuf = cryptoRes.ETH?.HUF || 1200000;

      set({
        exchangeRates: {
          USD: usdToHuf,
          EUR: eurToHuf,
          BTC: btcToHuf,
          ETH: ethToHuf,
          HUF: 1
        }
      });
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      // Robust fallback values if fetch fails
      set({
        exchangeRates: {
          USD: 365,
          EUR: 395,
          BTC: 24000000,
          ETH: 1200000,
          HUF: 1
        }
      });
    }
  },
}));
