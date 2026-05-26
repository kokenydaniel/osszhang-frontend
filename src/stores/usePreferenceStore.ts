import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_NAME, LEGACY_APP_NAMES } from '@/lib/branding';
import { getCurrentMonth, getCurrentYear } from '@/lib/dates';

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
  updatePreferences: (p: Partial<PreferenceState['userPreferences']>) => void;
  setExchangeRates: (rates: Record<string, number>) => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set, get) => ({
      selectedMonth: getCurrentMonth(),
      selectedYear: getCurrentYear(),
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

      updatePreferences: (p) =>
        set({ userPreferences: { ...get().userPreferences, ...p } }),

      setExchangeRates: (exchangeRates) => set({ exchangeRates }),
    }),
    {
      name: 'osszhang-preferences',
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

