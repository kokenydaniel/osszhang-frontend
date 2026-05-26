'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useBusinessUi } from '@/components/modules/business/BusinessUiContext';
import { businessService, BusinessService } from '@/services/BusinessService';
import { AiFinanceService } from '@/services/AiFinanceService';
import { resolveBusinessSettings } from '@/lib/businessSettings';
import { businessDisplayName } from '@/lib/mapHousehold';
import { isHouseholdReader, canEditHousehold } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { isAbortError } from '@/lib/api-client/abortError';
import { APP_NAME } from '@/lib/branding';
import type { BusinessOrder } from '@/types/business';

export function useBusinessLogic() {
  const {
    orders,
    isLoading,
    isLoaded,
    setOrders,
    setLoading,
    setLoaded,
    appendOrder,
    patchOrder,
    removeOrder,
  } = useBusinessStore();

  const ui = useBusinessUi();
  const { user } = useAuthStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: orderSaving, run: runOrderSave } = useAsyncAction();
  const pathname = usePathname();

  const businessName = businessDisplayName(user?.household);
  const isReader = isHouseholdReader(user);
  const shopifyImportEnabled =
    user?.household?.shopifyImportEnabled ?? user?.household?.shopify_import_enabled ?? false;
  const bizOptions = useMemo(() => resolveBusinessSettings(user?.household), [user?.household]);

  useEffect(() => {
    document.title = `${businessName} | ${APP_NAME}`;
  }, [businessName]);

  useEffect(() => {
    if (!pathname.startsWith('/business')) return;
    if (isLoaded || isLoading) return;

    let cancelled = false;
    const loadOrders = async () => {
      setLoading(true);
      try {
        const nextOrders = await businessService.fetchAll({ silent: true });
        if (!cancelled) {
          setOrders(nextOrders);
          setLoaded(true);
        }
      } catch (error) {
        if (!isAbortError(error) && !cancelled) {
          console.error('[useBusinessLogic] fetch failed', error);
          setLoading(false);
        }
      }
    };

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [pathname, isLoaded, isLoading, setLoading, setOrders, setLoaded]);

  const yearStats = useMemo(
    () => BusinessService.computeYearStats(orders, selectedYear),
    [orders, selectedYear],
  );

  const filteredOrders = useMemo(
    () => BusinessService.filterByMonth(orders, selectedYear, selectedMonth),
    [orders, selectedMonth, selectedYear],
  );

  const aiAdvice = useMemo(() => BusinessService.buildFallbackAdvice(yearStats), [yearStats]);
  const monthlyMetrics = useMemo(
    () => BusinessService.buildMonthlyMetrics(filteredOrders, yearStats.chartData, selectedMonth),
    [filteredOrders, selectedMonth, yearStats.chartData],
  );
  const summaryMetrics = useMemo(
    () => BusinessService.buildSummaryMetrics(yearStats, selectedYear),
    [selectedYear, yearStats],
  );

  const openForm = useCallback(
    (order?: BusinessOrder) => {
      ui.openOrderForm(order, bizOptions);
    },
    [bizOptions, ui],
  );

  const saveOrder = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!canEditHousehold(user)) return;
      if (!ui.amount.trim() || !ui.customer.trim()) return;

      await runOrderSave(async () => {
        const paidDate = ui.paidDate.trim() || null;
        const payload = {
          date: ui.orderDate,
          customerName: ui.customer.trim(),
          channel: ui.channel,
          paymentMethod: ui.payment,
          provider: ui.provider,
          destination: ui.destination,
          amount: Number(ui.amount),
          paidDate,
          invoiceId: ui.invoiceId.trim(),
          state: BusinessService.deriveOrderState(paidDate),
        };

        try {
          if (ui.editId) {
            const updated = await businessService.update(ui.editId, payload);
            patchOrder(ui.editId, updated);
            addNotification('Rendelés frissítve.', 'success');
          } else {
            const created = await businessService.create(payload);
            appendOrder(created);
            addNotification('Rendelés rögzítve.', 'success');
          }
          ui.closeOrderForm();
        } catch {
          addNotification('A rendelés mentése nem sikerült.', 'error');
        }
      });
    },
    [addNotification, appendOrder, patchOrder, runOrderSave, ui, user],
  );

  const deleteOrder = useCallback(
    async (id: number) => {
      try {
        await businessService.remove(id);
        removeOrder(id);
        addNotification('Rendelés törölve.', 'success');
      } catch {
        addNotification('A rendelés törlése nem sikerült.', 'error');
      }
    },
    [addNotification, removeOrder],
  );

  const syncShopify = useCallback(async () => {
    if (!canEditHousehold(user)) return;
    ui.setIsSyncing(true);
    addNotification('Shopify rendelések importálása elindult...', 'info');
    try {
      const nextOrders = await businessService.syncShopifyOrders();
      setOrders(nextOrders);
      setLoaded(true);
      addNotification('Shopify rendelések sikeresen szinkronizálva!', 'success');
    } catch {
      addNotification('Shopify importálás sikertelen volt.', 'error');
    } finally {
      ui.setIsSyncing(false);
    }
  }, [addNotification, setLoaded, setOrders, ui, user]);

  const requestAiAdvice = useCallback(async () => {
    ui.setIsAiLoading(true);
    try {
      const prompt = BusinessService.buildStrategyPrompt(businessName, selectedYear, yearStats);
      const advice = await AiFinanceService.getStrategyAdvice(prompt);
      ui.setRealAiAdvice(advice);
    } finally {
      ui.setIsAiLoading(false);
    }
  }, [businessName, selectedYear, ui, yearStats]);

  const pageLoading = isLoading && !isLoaded;

  return {
    businessName,
    selectedMonth,
    selectedYear,
    activeTab: ui.activeTab,
    setActiveTab: ui.setActiveTab,
    filteredOrders,
    monthlyMetrics,
    summaryMetrics,
    shopifyImportEnabled,
    isSyncing: ui.isSyncing,
    syncShopify,
    openForm,
    deleteOrder,
    requestDelete,
    isLoading,
    pageLoading,
    orderSaving,
    isReader,
    realAiAdvice: ui.realAiAdvice,
    isAiLoading: ui.isAiLoading,
    requestAiAdvice,
    aiAdvice,
    chartData: yearStats.chartData,
    channelData: yearStats.channelData,
    totalYTD: yearStats.totalYTD,
    bizOptions,
    saveOrder,
    ConfirmDeleteModal,
  };
}

export type BusinessLogicResult = ReturnType<typeof useBusinessLogic>;
