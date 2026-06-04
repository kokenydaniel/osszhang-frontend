'use client';

import { useCallback } from 'react';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { useDebtsStore } from '@/stores/debtsStore';
import { useWalletStore } from '@/stores/useWalletStore';
import type { CashTransaction } from '@/types';
import { budgetClient, debtsClient, insuranceClient } from '@/lib/api-client';
import { today as todayDate } from '@/utils/dates';
import { isHouseholdReader } from '@/utils/household-role';
import { useAuthStore } from '@/stores/useAuthStore';
import { StatusCodes } from '@/types/api';
import type { UtilityBill } from '@/types';
import type { DashboardUnpaidItem } from '@/helpers/dashboard-types';
import { buildDebtInstallmentBudgetUpdate, parseDebtInstallmentId } from '@/helpers/debt-budget';
import {
  parseInsurancePremiumId,
  withInsurancePeriodPaid,
} from '@/helpers/insurance-budget';
import { useInsuranceStore } from '@/stores/insuranceStore';

export function useDashboardPayActions() {
  const { user } = useAuthStore();
  const isReader = isHouseholdReader(user);
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const transactions = useBudgetStore((s) => s.transactions);
  const setTransactions = useBudgetStore((s) => s.setTransactions);
  const bills = useUtilitiesStore((s) => s.bills);
  const patchBill = useUtilitiesStore((s) => s.patchBill);
  const debts = useDebtsStore((s) => s.debts);
  const patchDebt = useDebtsStore((s) => s.patchDebt);

  const handlePayItem = useCallback(
    async (item: DashboardUnpaidItem) => {
      if (isReader) return;
      const paidOn = todayDate();

      if (item.type === 'expense') {
        const installment = parseDebtInstallmentId(item.id);
        if (installment) {
          const debt = debts.find((d) => d.id === installment.debtId);
          if (!debt || activeWalletId === null) return;
          const res = await debtsClient.update(
            debt.id,
            buildDebtInstallmentBudgetUpdate(
              debt,
              installment.year,
              installment.month,
              true,
              paidOn,
            ),
          );
          if (!res || res[0] !== StatusCodes.Http200) return;
          patchDebt(debt.id, res[1]);
          return;
        }

        const insuranceLine = parseInsurancePremiumId(item.id);
        if (insuranceLine) {
          const policy = useInsuranceStore.getState().budgetPolicies.find((p) => p.id === insuranceLine.policyId);
          if (!policy) return;
          const nextPolicy = withInsurancePeriodPaid(policy, insuranceLine.year, insuranceLine.month);
          const res = await insuranceClient.update(policy.id, {
            paidBudgetPeriods: nextPolicy.paidBudgetPeriods,
          });
          if (!res || res[0] !== StatusCodes.Http200) return;
          useInsuranceStore.getState().upsertPolicy(res[1]);
          return;
        }

        if (typeof item.id !== 'number') return;
        await budgetClient.update(item.id, { paidDate: paidOn });
        const tx = transactions.find((t: CashTransaction) => t.id === item.id);
        if (tx && activeWalletId !== null) {
          setTransactions(
            transactions.map((t: CashTransaction) =>
              t.id === item.id ? { ...t, paidDate: paidOn } : t,
            ),
          );
        }
        return;
      }

      if (typeof item.id !== 'number') return;

      const previous = bills.find((bill) => bill.id === item.id);
      if (!previous) return;

      const optimistic = { ...previous, paidDate: paidOn };
      patchBill(item.id, optimistic as UtilityBill);

      try {
        const { utilitiesClient } = await import('@/lib/api-client');
        const updated = await utilitiesClient.update(item.id, { paidDate: paidOn });
        if (!updated || updated[0] !== StatusCodes.Http200) throw new Error('API Error');
        patchBill(item.id, updated[1] as UtilityBill);
      } catch (error) {
        patchBill(item.id, previous);
        console.error('[dashboard] utility bill pay failed', error);
      }
    },
    [activeWalletId, bills, debts, isReader, patchBill, patchDebt, setTransactions, transactions],
  );

  return { handlePayItem, isReader };
}
