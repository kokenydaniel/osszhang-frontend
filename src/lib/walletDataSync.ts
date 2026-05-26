import { useBudgetStore } from '@/stores/useBudgetStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { savingsService } from '@/services/SavingsService';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { ensureBudgetGoalsLoaded } from '@/lib/budgetDataLoader';

/**
 * Syncs savings accounts for a wallet via SavingsService (Budget cross-domain side-effect).
 * TODO: Refactor to Event Bus for cross-domain side effects.
 */
export async function syncSavingsForWallet(walletId: number | null): Promise<void> {
  if (walletId === null) return;
  try {
    const { accounts } = await savingsService.fetchAll(walletId, {
      forceReload: true,
      silent: true,
    });
    useSavingsStore.getState().setSavings(accounts, walletId);
  } catch {
    // Silently ignore — this is a background sync
  }
}

/**
 * Triggers a refresh of the budget goal rows for the currently active wallet
 * and selected period.
 *
 * TODO: Refactor to Event Bus for cross-domain side effects
 */
export function refreshBudgetGoalRows(): void {
  const budget = useBudgetStore.getState();
  const { selectedMonth, selectedYear } = usePreferenceStore.getState();
  const walletId = budget.loadedWalletId;
  if (walletId === null) return;

  void ensureBudgetGoalsLoaded(walletId, selectedMonth, selectedYear, { silent: true }).catch((error) => {
    console.error('Failed to sync budget goal rows', error);
  });
}
