import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { useWalletStore } from '@/stores/useWalletStore';
import type { UtilitiesIndexResponse } from '@/types';

type UtilitiesMutationPayload = Partial<UtilitiesIndexResponse> & {
  manual_balance?: number;
};

function patchWalletManualBalance(manualBalance: number): void {
  const user = useAuthStore.getState().user;
  const activeWalletId = useWalletStore.getState().activeWalletId;
  if (!user?.wallets?.length) return;

  const wallets = user.wallets.map((wallet) => {
    if (wallet.is_shared) return { ...wallet, manual_balance: manualBalance };
    if (activeWalletId !== null && wallet.id === activeWalletId) {
      return { ...wallet, manual_balance: manualBalance };
    }
    return wallet;
  });

  useAuthStore.setState({ user: { ...user, wallets } });
}

export function syncAfterUtilitiesSettlementMutation(
  payload: UtilitiesMutationPayload,
  period: { selectedYear: number; selectedMonth: number },
): void {
  if (payload.bills && payload.settlements) {
    useUtilitiesStore.getState().setUtilities({
      bills: payload.bills,
      settlements: payload.settlements,
    });
  }

  if (typeof payload.manual_balance === 'number') {
    patchWalletManualBalance(payload.manual_balance);
  }

  const activeWalletId = useWalletStore.getState().activeWalletId;
  if (activeWalletId !== null) {
    void useBudgetStore.getState().fetch(
      activeWalletId,
      period.selectedYear,
      period.selectedMonth,
      true,
    );
  }
}
