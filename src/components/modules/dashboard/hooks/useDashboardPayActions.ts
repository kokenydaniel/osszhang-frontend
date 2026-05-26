'use client';

import { useCallback } from 'react';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { BudgetService } from '@/services/BudgetService';
import { today as todayDate } from '@/lib/dates';
import { isHouseholdReader } from '@/lib/householdRole';
import { useAuthStore } from '@/stores/useAuthStore';
import type { DashboardUnpaidItem } from '@/components/modules/dashboard/lib/dashboardTypes';

export function useDashboardPayActions() {
  const { user } = useAuthStore();
  const isReader = isHouseholdReader(user);
  const budgetStore = useBudgetStore();
  const bills = useUtilitiesStore((s) => s.bills);

  const handlePayItem = useCallback(
    async (item: DashboardUnpaidItem) => {
      if (isReader) return;
      const paidOn = todayDate();

      if (item.type === 'expense') {
        await BudgetService.updateTransaction(item.id, { paidDate: paidOn });
        const tx = budgetStore.transactions.find((t) => t.id === item.id);
        if (tx && budgetStore.loadedWalletId !== null) {
          budgetStore.setTransactions(
            budgetStore.transactions.map((t) => (t.id === item.id ? { ...t, paidDate: paidOn } : t)),
            budgetStore.loadedWalletId,
          );
        }
        return;
      }

      const previous = bills.find((bill) => bill.id === item.id);
      if (!previous) return;

      const optimistic = { ...previous, paidDate: paidOn };
      useUtilitiesStore.getState().patchBill(item.id, optimistic);

      try {
        const { utilitiesService } = await import('@/services/UtilitiesService');
        const updated = await utilitiesService.update(item.id, { paidDate: paidOn });
        useUtilitiesStore.getState().patchBill(item.id, updated);
      } catch (error) {
        useUtilitiesStore.getState().patchBill(item.id, previous);
        console.error('[dashboard] utility bill pay failed', error);
      }
    },
    [bills, budgetStore, isReader],
  );

  return { handlePayItem, isReader };
}
