'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useBusinessStore } from '@/stores/businessStore';
import { isStoreLoading } from '@/utils/loadable-status';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import config from '@/config/config';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { businessClient } from '@/lib/api-client';
import { businessCalculations } from '@/calculations/business';
import { StatusCodes } from '@/types/api';
import { aiHelpers } from '@/helpers/ai-helpers';
import { resolveBusinessSettings, businessDisplayName } from '@/settings/business';
import { isHouseholdReader, canEditHousehold } from '@/utils/household-role';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { BusinessOrder, CreateBusinessOrderPayload } from '@/types/business';

export function useBusinessPageData() {
  const { user } = useAuthStore();
  const householdId = user?.household?.id;
  const { selectedMonth, selectedYear } = usePeriodStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const orders = useBusinessStore((s) => s.orders);
  const status = useBusinessStore((s) => s.status);
  const patchOrder = useBusinessStore((s) => s.patchOrder);
  const appendOrder = useBusinessStore((s) => s.appendOrder);
  const removeOrder = useBusinessStore((s) => s.removeOrder);
  const setOrders = useBusinessStore((s) => s.setOrders);
  const loading = isStoreLoading(status);

  useEffect(() => {
    void useBusinessStore.getState().fetch(householdId);
  }, [householdId]);

  const businessName = businessDisplayName(user?.household);
  const isReader = isHouseholdReader(user);
  const shopifyImportEnabled =
    user?.household?.shopify_import_enabled ?? user?.household?.shopify_import_enabled ?? false;
  const bizOptions = useMemo(() => resolveBusinessSettings(user?.household), [user?.household]);

  useEffect(() => {
    document.title = `${businessName} | ${config.branding.appName}`;
  }, [businessName]);

  const yearStats = useMemo(
    () => businessCalculations.computeYearStats(orders, selectedYear),
    [orders, selectedYear],
  );

  const filteredOrders = useMemo(
    () => businessCalculations.filterByMonth(orders, selectedYear, selectedMonth),
    [orders, selectedMonth, selectedYear],
  );

  const aiAdvice = useMemo(() => businessCalculations.buildFallbackAdvice(yearStats), [yearStats]);
  const monthlyMetrics = useMemo(
    () => businessCalculations.buildMonthlyMetrics(filteredOrders, yearStats.chartData, selectedMonth),
    [filteredOrders, selectedMonth, yearStats.chartData],
  );
  const summaryMetrics = useMemo(
    () => businessCalculations.buildSummaryMetrics(yearStats, selectedYear),
    [selectedYear, yearStats],
  );

  const saveOrder = useCallback(
    async (payload: CreateBusinessOrderPayload, editId: number | null) => {
      if (!canEditHousehold(user)) return;

      try {
        if (editId) {
          const res = await businessClient.update(editId, payload);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          patchOrder(editId, res[1] as BusinessOrder);
          addNotification('Rendelés frissítve.', 'success');
        } else {
          const res = await businessClient.create(payload);
          if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
            throw new Error('API Error');
          }
          appendOrder(res[1] as BusinessOrder);
          addNotification('Rendelés rögzítve.', 'success');
        }
      } catch {
        addNotification('A rendelés mentése nem sikerült.', 'error');
        throw new Error();
      }
    },
    [addNotification, appendOrder, patchOrder, user],
  );

  const deleteOrder = useCallback(
    async (id: number) => {
      try {
        await businessClient.delete(id);
        removeOrder(id);
        addNotification('Rendelés törölve.', 'success');
      } catch {
        addNotification('A rendelés törlése nem sikerült.', 'error');
        throw new Error();
      }
    },
    [addNotification, removeOrder],
  );

  const syncShopify = useCallback(async () => {
    if (!canEditHousehold(user)) return;
    addNotification('Shopify rendelések importálása elindult...', 'info');
    try {
      await businessClient.shopifyImport();
      const res = await businessClient.getAll({ silent: true });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      if (householdId) setOrders((res[1] ?? []) as BusinessOrder[], householdId);
      addNotification('Shopify rendelések sikeresen szinkronizálva!', 'success');
    } catch {
      addNotification('Shopify importálás sikertelen volt.', 'error');
      throw new Error();
    }
  }, [addNotification, householdId, setOrders, user]);

  const requestAiAdvice = useCallback(
    async (setAdvice: (advice: string) => void) => {
      const prompt = businessCalculations.buildStrategyPrompt(businessName, selectedYear, yearStats);
      const advice = await aiHelpers.getStrategyAdvice(prompt);
      setAdvice(advice);
    },
    [businessName, selectedYear, yearStats],
  );

  return {
    user,
    businessName,
    selectedMonth,
    selectedYear,
    filteredOrders,
    monthlyMetrics,
    summaryMetrics,
    shopifyImportEnabled,
    pageLoading: loading && orders.length === 0,
    isReader,
    bizOptions,
    deleteOrder,
    requestDelete,
    saveOrder,
    syncShopify,
    requestAiAdvice,
    aiAdvice,
    chartData: yearStats.chartData,
    channelData: yearStats.channelData,
    totalYTD: yearStats.totalYTD,
    ConfirmDeleteModal,
  };
}
