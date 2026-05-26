/**
 * @deprecated
 * This file is a transitional re-export barrel.
 * All exports have moved to `@/mappers/savings.mapper`.
 * Update your imports to use the new path and remove this file
 * once all consumers have been migrated.
 */
export {
  mapSavingsAccountFromApi,
  mapSavingsAccountsFromApi,
  savingsAccountToApiPayload,
  type RawSavingsAccount,
} from '@/mappers/savings.mapper';

/**
 * @deprecated Use `SavingsService.computeBalance(account)` instead.
 * Kept for backwards-compat during migration. Will be removed.
 */
export { SavingsService as _savingsBalanceCompat } from '@/services/SavingsService';

import { SavingsService } from '@/services/SavingsService';
import type { SavingsAccount } from '@/types/savings';

/** @deprecated Use `SavingsService.computeBalance(account)` instead. */
export function savingsBalance(item: SavingsAccount): number {
  return SavingsService.computeBalance(item);
}
