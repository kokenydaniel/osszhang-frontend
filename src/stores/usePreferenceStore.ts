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
    // Implement if needed
  },
}));
