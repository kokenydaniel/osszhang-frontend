import { useWalletStore } from '@/stores/useWalletStore';

export function getActiveWalletId(): number | null {
  return useWalletStore.getState().activeWalletId;
}
