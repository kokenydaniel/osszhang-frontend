import { savingsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { useSavingsStore } from '@/stores/savingsStore';

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

  }
}

