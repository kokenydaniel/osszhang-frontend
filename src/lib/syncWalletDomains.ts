import { ensureBudgetPeriodLoaded } from '@/lib/budgetDataLoader';
import { savingsService } from '@/services/SavingsService';
import { debtsService } from '@/services/DebtsService';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';

export type WalletDomainSyncOptions = {
  silent?: boolean;
};

/**
 * Reloads all wallet-scoped domain caches after a wallet switch.
 * Household-scoped modules (utilities, meters, business) are not wallet-bound.
 */
export async function syncWalletDomainCaches(
  walletId: number | null,
  options: WalletDomainSyncOptions = {},
): Promise<void> {
  if (walletId === null) return;

  const silent = options.silent ?? true;
  const { selectedMonth, selectedYear } = usePreferenceStore.getState();

  await Promise.allSettled([
    ensureBudgetPeriodLoaded(walletId, selectedMonth, selectedYear, { silent }).catch((error) => {
      console.error('[syncWalletDomainCaches] budget fetch failed', error);
    }),
    savingsService
      .fetchAll(walletId, { forceReload: true, silent })
      .then(({ accounts }) => useSavingsStore.getState().setSavings(accounts, walletId))
      .catch((error) => {
        console.error('[syncWalletDomainCaches] savings fetch failed', error);
      }),
    savingsService
      .fetchInvestments({ silent })
      .then((investments) => useSavingsStore.getState().setInvestments(investments))
      .catch((error) => {
        console.error('[syncWalletDomainCaches] investments fetch failed', error);
      }),
    debtsService
      .fetchAll(walletId, { silent })
      .then((debts) => useDebtsStore.getState().setDebts(debts, walletId))
      .catch((error) => {
        console.error('[syncWalletDomainCaches] debts fetch failed', error);
      }),
  ]);
}
