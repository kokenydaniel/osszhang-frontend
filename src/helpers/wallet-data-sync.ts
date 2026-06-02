import { savingsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { useSavingsStore } from '@/stores/savingsStore';

/**
 * Syncs savings accounts for a wallet via SavingsService (Budget cross-domain side-effect).
 * TODO: Refactor to Event Bus for cross-domain side effects.
 */
export async function syncSavingsForWallet(walletId: number | null): Promise<void> {
  if (walletId === null) return;
  try {
    const res = await savingsClient.getAll(walletId, {
      silent: true,
    });
    if (res && res[0] === StatusCodes.Http200) {
      useSavingsStore.getState().setSavings(res[1] ?? [], walletId);
    }
  } catch {
    // Silently ignore — this is a background sync
  }
}

