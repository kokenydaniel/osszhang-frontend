import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletProfile } from '@/types';

interface WalletState {
  activeWalletId: number | null;
  activeHouseholdId: number | null;
  setActiveWalletId: (walletId: number | null) => void;
  syncFromUser: (wallets: WalletProfile[] | undefined, householdId: number | undefined) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      activeWalletId: null,
      activeHouseholdId: null,

      setActiveWalletId: (walletId) => {
        if (get().activeWalletId === walletId) return;
        set({ activeWalletId: walletId });
      },

      syncFromUser: (wallets, householdId) => {
        const { activeWalletId: prevWalletId, activeHouseholdId: prevHousehold } = get();
        const nextHousehold = householdId ?? null;

        if (!wallets?.length || householdId === undefined) {
          if (prevWalletId !== null || prevHousehold !== nextHousehold) {
            set({ activeWalletId: null, activeHouseholdId: nextHousehold });
          }
          return;
        }

        const stillValid =
          prevHousehold === householdId &&
          prevWalletId !== null &&
          wallets.some((w) => w.id === prevWalletId);

        if (stillValid) return;

        const shared = wallets.find((w) => w.is_shared) ?? wallets[0];
        const nextWalletId = shared?.id ?? null;

        if (prevWalletId !== nextWalletId || prevHousehold !== householdId) {
          set({ activeWalletId: nextWalletId, activeHouseholdId: householdId });
        }
      },

      reset: () => set({ activeWalletId: null, activeHouseholdId: null }),
    }),
    {
      name: 'osszhang-active-wallet',
      partialize: (state) => ({
        activeWalletId: state.activeWalletId,
        activeHouseholdId: state.activeHouseholdId,
      }),
    },
  ),
);

