import type { UserProfile, WalletProfile } from '@/types';
import { getActiveWalletId } from '@/stores/useWalletStore';

export function resolveActiveWallet(
  user: UserProfile | null | undefined,
  walletId?: number | null,
): WalletProfile | undefined {
  const wallets = user?.wallets ?? [];
  if (!wallets.length) return undefined;

  const targetId = walletId ?? getActiveWalletId();
  if (targetId !== null) {
    const match = wallets.find((w) => w.id === targetId);
    if (match) return match;
  }

  return wallets.find((w) => w.isShared) ?? wallets[0];
}

export function activeWalletManualBalance(user: UserProfile | null | undefined): number {
  return resolveActiveWallet(user)?.manualBalance ?? 0;
}
