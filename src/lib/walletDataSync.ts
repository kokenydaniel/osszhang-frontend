import { useBudgetStore } from '@/stores/useBudgetStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useSavingsStore } from '@/stores/useSavingsStore';

export async function syncSavingsForWallet(walletId: number | null): Promise<void> {
  if (walletId === null) return;
  await useSavingsStore.getState().fetchSavings(walletId, { forceReload: true, silent: true });
}

export function refreshBudgetGoalRows(): void {
  const budget = useBudgetStore.getState();
  const { selectedMonth, selectedYear } = usePreferenceStore.getState();
  if (budget.loadedWalletId === null) return;
  void budget.fetchGoalRows(budget.loadedWalletId, selectedMonth, selectedYear, true);
}
