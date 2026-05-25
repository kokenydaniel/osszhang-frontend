import type { RawApiWallet, WalletProfile } from '@/types';

export function mapWalletFromApi(w: RawApiWallet): WalletProfile {
  return {
    id: w.id,
    householdId: w.householdId ?? w.household_id ?? 0,
    name: w.name,
    ownerId: w.ownerId ?? w.owner_id ?? null,
    isShared: w.isShared ?? w.is_shared ?? false,
    manualBalance: w.manualBalance ?? w.manual_balance ?? 0,
  };
}
