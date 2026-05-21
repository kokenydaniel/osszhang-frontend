import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_NAME, LEGACY_APP_NAMES } from '@/lib/branding';

interface PreferenceState {
  selectedMonth: number;
  selectedYear: number;
  userPreferences: {
    currency: string;
    notificationsEnabled: boolean;
    appName: string;
    themeColor: 'violet' | 'emerald' | 'blue' | 'rose' | 'amber';
    appLogo: 'diamond' | 'ring' | 'helix' | 'sphere';
  };
  exchangeRates: Record<string, number>;

  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  updatePreferences: (p: Partial<PreferenceState['userPreferences']>) => Promise<void>;
  refreshRates: () => Promise<void>;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set, get) => ({
      selectedMonth: new Date().getMonth() + 1,
      selectedYear: new Date().getFullYear(),
      userPreferences: {
        currency: 'HUF',
        notificationsEnabled: true,
        appName: APP_NAME,
        themeColor: 'violet',
        appLogo: 'diamond',
      },
      exchangeRates: {},

      setSelectedMonth: (m) => set({ selectedMonth: m }),
      setSelectedYear: (y) => set({ selectedYear: y }),
      
      updatePreferences: async (p) => {
        set({ userPreferences: { ...get().userPreferences, ...p } });
      },

      refreshRates: async () => {
        try {
          const [fiatRes, btcRes, ethRes] = await Promise.all([
            fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json()),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT').then(r => r.json()),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT').then(r => r.json())
          ]);

          const usdToHuf = fiatRes.rates?.HUF || 365;
          const eurToHuf = fiatRes.rates?.HUF && fiatRes.rates?.EUR ? (fiatRes.rates.HUF / fiatRes.rates.EUR) : 395;
          
          const btcPriceUsd = Number(btcRes?.price) || 66000;
          const ethPriceUsd = Number(ethRes?.price) || 3000;

          const btcToHuf = btcPriceUsd * usdToHuf;
          const ethToHuf = ethPriceUsd * usdToHuf;

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
    }),
    {
      name: 'penzpilot-preferences',
      partialize: (state) => ({
        userPreferences: state.userPreferences,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<PreferenceState> | undefined;
        const storedName = stored?.userPreferences?.appName;
        const appName =
          storedName && !LEGACY_APP_NAMES.includes(storedName as (typeof LEGACY_APP_NAMES)[number])
            ? storedName
            : APP_NAME;

        return {
          ...current,
          ...stored,
          userPreferences: {
            ...current.userPreferences,
            ...stored?.userPreferences,
            appName,
          },
        };
      },
    }
  )
);

