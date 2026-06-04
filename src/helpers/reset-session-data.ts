import { resetModuleDataCache } from '@/helpers/module-data-plan';
import { clearUtilitiesDataLoaderCache } from '@/helpers/utilities-loader';
import { clearAiCfoLoaderCache } from '@/helpers/ai-cfo-loader';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { useMetersStore } from '@/stores/metersStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useDebtsStore } from '@/stores/debtsStore';
import { useSavingsStore } from '@/stores/savingsStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { insuranceStore } from '@/stores/insuranceStore';
import { rentalStore } from '@/stores/rentalStore';
import { pocketMoneyStore } from '@/stores/pocketMoneyStore';
import { receivablesStore } from '@/stores/receivablesStore';

/**
 * Clears all in-memory domain caches when the authenticated user changes.
 */
export function resetSessionData(): void {
  resetModuleDataCache();
  clearUtilitiesDataLoaderCache();
  clearAiCfoLoaderCache();

  useUtilitiesStore.getState().reset();
  useMetersStore.getState().reset();
  useBusinessStore.getState().reset();
  useDebtsStore.getState().reset();
  useSavingsStore.getState().reset();
  useBudgetStore.getState().reset();
  useDashboardStore.getState().clearAiCfoAdvice();
  useWalletStore.getState().reset();
  insuranceStore.getState().reset();
  rentalStore.getState().reset();
  pocketMoneyStore.getState().reset();
  receivablesStore.getState().reset();
}
