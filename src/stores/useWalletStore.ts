import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletProfile } from '@/types';
import { syncWalletDomainCaches } from '@/lib/syncWalletDomains';

interface WalletState {
  activeWalletId: number | null;
  activeHouseholdId: number | null;
  setActiveWalletId: (walletId: number | null) => void;
  syncFromUser: (wallets: WalletProfile[] | undefined, householdId: number | undefined) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      activeWalletId: null,
      activeHouseholdId: null,

      setActiveWalletId: (walletId) => {
        if (get().activeWalletId === walletId) return;
        set({ activeWalletId: walletId });
        void syncWalletDomainCaches(walletId, { silent: true });
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

        const shared = wallets.find((w) => w.isShared) ?? wallets[0];
        const nextWalletId = shared?.id ?? null;

        if (prevWalletId !== nextWalletId || prevHousehold !== householdId) {
          set({ activeWalletId: nextWalletId, activeHouseholdId: householdId });
          void syncWalletDomainCaches(nextWalletId, { silent: true });
        }
      },
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

export function getActiveWalletId(): number | null {
  return useWalletStore.getState().activeWalletId;
}
