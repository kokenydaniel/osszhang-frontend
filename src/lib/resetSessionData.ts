import { resetRouteDataCache } from '@/lib/loadRouteData';
import { clearBudgetDataLoaderCache } from '@/lib/budgetDataLoader';
import { clearUtilitiesDataLoaderCache } from '@/lib/utilitiesDataLoader';
import { clearBudgetAiInsightsLoaderCache } from '@/lib/budgetAiInsightsLoader';
import { clearAiCfoLoaderCache } from '@/lib/aiCfoLoader';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useMetersStore } from '@/stores/useMetersStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useWalletStore } from '@/stores/useWalletStore';

/**
 * Clears all in-memory domain caches when the authenticated user changes
 * (logout, login, impersonation). Prevents the previous user's data from
 * leaking into the next session.
 */
export function resetSessionData(): void {
  resetRouteDataCache();
  clearBudgetDataLoaderCache();
  clearUtilitiesDataLoaderCache();
  clearBudgetAiInsightsLoaderCache();
  clearAiCfoLoaderCache();

  useBudgetStore.getState().reset();
  useUtilitiesStore.getState().reset();
  useMetersStore.getState().reset();
  useBusinessStore.getState().reset();
  useDebtsStore.getState().reset();
  useSavingsStore.getState().reset();
  useDashboardStore.getState().clearAiCfoAdvice();
  useWalletStore.getState().reset();
}
