import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletProfile } from '@/types';

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
        void import('@/services/BudgetService').then(({ BudgetService }) => {
          if (walletId !== null) {
            void BudgetService.fetchAll(walletId, { silent: true }).then((res) => {
              void import('@/stores/useBudgetStore').then(({ useBudgetStore }) => {
                useBudgetStore.getState().setTransactions(res.data.transactions, walletId);
              });
            }).catch(console.error);
          }
        });
        void import('@/lib/walletDataSync').then(({ syncSavingsForWallet }) => {
          void syncSavingsForWallet(walletId);
        });
        void import('@/services/DebtsService').then(({ debtsService }) => {
          if (walletId === null) return;
          void debtsService
            .fetchAll(walletId, { silent: true })
            .then((debts) => {
              void import('@/stores/useDebtsStore').then(({ useDebtsStore }) => {
                useDebtsStore.getState().setDebts(debts, walletId);
              });
            })
            .catch(console.error);
        });
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
