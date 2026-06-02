'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { syncAfterUtilitiesSettlementMutation } from '@/helpers/utilities-settlement-sync';
import { canUseFeature } from '@/helpers/check-access';
import { isHouseholdReader, canEditHousehold } from '@/utils/household-role';
import { utilitiesCalculations } from '@/calculations/utilities';
import type { UtilityBill } from '@/types';
import type { UtilitiesIndex } from '@/types/utilities';
import { PageHeader, MetricStrip } from '@/components/design';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { utilitiesClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { formatHUF } from '@/utils';
import { UtilitiesBillsTable } from './bills-table/bills-table';
import { UtilitiesSettlementPanel } from './settlement/settlement-panel';
import { UtilitiesAiPanel } from './ai-panel/ai-panel';
import { UtilitiesActionButtons } from './action-buttons';

interface UtilitiesPageContentProps {
  data: UtilitiesIndex;
  onOpenNewBill: () => void;
  onEditBill: (bill: UtilityBill) => void;
  onRefresh: () => void;
}

export function UtilitiesPageContent({
  data,
  onOpenNewBill,
  onEditBill,
  onRefresh,
}: UtilitiesPageContentProps) {
  const { user } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { selectedMonth, selectedYear } = usePeriodStore();
  const { addNotification } = useNotificationStore();
  const [settling, setSettling] = useState(false);

  const isReader = isHouseholdReader(user);
  const canEdit = canEditHousehold(user);
  const isAdmin = user?.role === 'admin';
  const utilitySplitEnabled =
    (user?.household?.utility_split_enabled ?? user?.household?.utility_split_enabled ?? false) &&
    canUseFeature(user, 'utility_split');

  const utilityLabels = useMemo(() => utilitiesCalculations.resolveSplitLabels(user), [user]);

  const filteredBills = useMemo(
    () => utilitiesCalculations.filterBillsByMonth(data.bills, selectedMonth, selectedYear),
    [data.bills, selectedMonth, selectedYear],
  );

  const sortedBills = useMemo(
    () => utilitiesCalculations.sortBillsByDueDate(filteredBills),
    [filteredBills],
  );

  const monthSettlement = useMemo(
    () => utilitiesCalculations.findMonthSettlement(data.settlements, selectedYear, selectedMonth),
    [data.settlements, selectedYear, selectedMonth],
  );

  const balance = useMemo(
    () => utilitiesCalculations.computeNetBalance(filteredBills, user?.id, utilityLabels.partnerId, utilitySplitEnabled),
    [filteredBills, user?.id, utilityLabels.partnerId, utilitySplitEnabled],
  );

  const handleSettle = useCallback(async () => {
    if (!isAdmin || balance.netBalance === 0 || monthSettlement) return;
    setSettling(true);
    try {
      const res = await utilitiesClient.settleMonth(selectedMonth, selectedYear);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      const settlement = (res[1] as { settlement: { direction: string; amount: number } }).settlement;
      const msg =
        settlement.direction === 'partner_pays_household'
          ? `Elszámolás rögzítve — bevétel és egyenleg +${formatHUF(settlement.amount)}`
          : `Elszámolás rögzítve — kiadás és egyenleg −${formatHUF(settlement.amount)}`;
      addNotification(msg, 'success');
      syncAfterUtilitiesSettlementMutation(res[1], { selectedYear, selectedMonth });
      if (!res[1].bills || !res[1].settlements) {
        onRefresh();
      }
    } catch {
      addNotification('Az elszámolás nem sikerült.', 'error');
    } finally {
      setSettling(false);
    }
  }, [
    addNotification,
    balance.netBalance,
    isAdmin,
    monthSettlement,
    activeWalletId,
    onRefresh,
    selectedMonth,
    selectedYear,
  ]);

  const metrics = useMemo(() => {
    const items = utilitiesCalculations.buildMetricStrip({
      utilitySplitEnabled,
      monthSettlement,
      counterpartyLabel: utilityLabels.counterpartyLabel,
      rawNetBalance: balance.netBalance,
      partnerOwesUsTotal: balance.partnerOwesUs,
      weOwePartnerTotal: balance.weOwePartner,
      wePaidGrandTotal: balance.wePaidGrandTotal,
      partnerPaidGrandTotal: balance.partnerPaidGrandTotal,
      filteredBills,
      paidCount: filteredBills.filter((b) => !!b.paidDate).length,
      totalCount: filteredBills.length,
    });

    if (!utilitySplitEnabled || monthSettlement || !isAdmin || balance.netBalance === 0) {
      return items;
    }

    return items.map((item, index) =>
      index === 0
        ? {
            ...item,
            action: (
              <Button size="sm" loading={settling} onClick={() => void handleSettle()} className="shrink-0">
                Elszámolás
              </Button>
            ),
          }
        : item,
    );
  }, [
    balance.netBalance,
    balance.partnerOwesUs,
    balance.partnerPaidGrandTotal,
    balance.weOwePartner,
    balance.wePaidGrandTotal,
    filteredBills,
    handleSettle,
    isAdmin,
    monthSettlement,
    settling,
    utilityLabels.counterpartyLabel,
    utilitySplitEnabled,
  ]);

  return (
    <div className="flex flex-col gap-7 max-w-[1500px] mx-auto w-full">
      <PageHeader
        breadcrumbs={[{ label: 'Közüzem' }, { label: 'Rezsi' }]}
        title="Rezsi menedzsment"
        description="Automatikus elszámolás, megosztás és kiegyenlítés."
        actions={
          canEdit ? (
            <UtilitiesActionButtons
              bills={data.bills}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onOpenNewBill={onOpenNewBill}
              onRefresh={onRefresh}
            />
          ) : undefined
        }
      />

      <UtilitiesSettlementPanel
        monthSettlement={monthSettlement}
        utilitySplitEnabled={utilitySplitEnabled}
        isAdmin={isAdmin}
        utilityLabels={utilityLabels}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <MetricStrip items={metrics} columns={4} variant="separated" />

      <UtilitiesAiPanel selectedMonth={selectedMonth} selectedYear={selectedYear} />

      <UtilitiesBillsTable
        sortedBills={sortedBills}
        filteredBills={filteredBills}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        utilitySplitEnabled={utilitySplitEnabled}
        utilityLabels={utilityLabels}
        isReader={isReader}
        onEditBill={onEditBill}
        onRefresh={onRefresh}
      />
    </div>
  );
}
