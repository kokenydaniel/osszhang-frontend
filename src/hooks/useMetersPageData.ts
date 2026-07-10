'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { today, toDayjs } from '@/utils/dates';
import { useMetersStore } from '@/stores/metersStore';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { isStoreLoading } from '@/utils/loadable-status';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { metersClient } from '@/lib/api-client';
import { metersCalculations } from '@/calculations/meters';
import { StatusCodes } from '@/types/api';
import { aiHelpers } from '@/helpers/ai-helpers';
import { ensureUtilityAnomaliesLoaded } from '@/helpers/utility-anomalies-loader';
import { resolveMetersSettings } from '@/settings/meters';
import { canLoadUtilityAnomalies } from '@/helpers/dashboard-access';
import { canUseFeature } from '@/helpers/check-access';
import { isHouseholdReader, canEditHousehold } from '@/utils/household-role';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { Meter, MeterReading } from '@/types';

export function useMetersPageData() {
  const { user } = useAuthStore();
  const householdId = user?.household?.id;
  const { selectedMonth, selectedYear } = usePeriodStore();
  const { aiUtilityAnomalies, setAiUtilityAnomalies } = useUtilitiesStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const meters = useMetersStore((s) => s.meters);
  const status = useMetersStore((s) => s.status);
  const patchMeter = useMetersStore((s) => s.patchMeter);
  const appendMeter = useMetersStore((s) => s.appendMeter);
  const removeMeter = useMetersStore((s) => s.removeMeter);
  const loading = isStoreLoading(status);

  useEffect(() => {
    void useMetersStore.getState().fetch(householdId);
  }, [householdId]);

  const metersSettings = useMemo(() => resolveMetersSettings(user?.household), [user?.household]);
  const isReader = isHouseholdReader(user);
  const canUseAi = canUseFeature(user, 'ai');
  const canLoadAnomalies = canLoadUtilityAnomalies(user);
  const locationGroups = useMemo(
    () => metersCalculations.groupByLocationGroups(meters, metersSettings.location_groups),
    [meters, metersSettings.location_groups],
  );

  const missingReadingsCount = useMemo(() => {
    const reminderDay = metersSettings.reading_reminder_day || 0;
    if (reminderDay === 0) return 0;
    
    const todayObj = toDayjs(today());
    const currentMonth = todayObj.month() + 1;
    const currentYear = todayObj.year();
    const currentDay = todayObj.date();
    
    if (currentDay < reminderDay) return 0;
    
    return meters.filter(m => !m.readings.some(r => r.year === currentYear && r.month === currentMonth)).length;
  }, [meters, metersSettings.reading_reminder_day]);

  const refreshAiAnomalies = useCallback(async () => {
    if (!canLoadAnomalies) return null;
    const data = await ensureUtilityAnomaliesLoaded(selectedYear, selectedMonth, { force: true });
    setAiUtilityAnomalies(data);
    return data;
  }, [canLoadAnomalies, selectedMonth, selectedYear, setAiUtilityAnomalies]);

  useEffect(() => {
    if (!canLoadAnomalies) return;
    void ensureUtilityAnomaliesLoaded(selectedYear, selectedMonth).then((data) => {
      setAiUtilityAnomalies(data);
    });
  }, [canLoadAnomalies, selectedMonth, selectedYear, setAiUtilityAnomalies]);

  const getPreviousYearValue = useCallback(
    (mId: number, month: number, year: number): number | null => {
      const meter = meters.find((m) => m.id === mId);
      if (!meter) return null;
      return metersCalculations.getPreviousYearConsumption(meter, month, year);
    },
    [meters],
  );

  const createMeter = useCallback(
    async (values: { name: string; unit: string; location: string }) => {
      if (!canEditHousehold(user) || !householdId) return;
      const payload = metersCalculations.buildMeterPayload(values);
      const res = await metersClient.create({ ...payload, household_id: householdId });
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
        addNotification('A mérőóra mentése nem sikerült.', 'error');
        throw new Error('API Error');
      }
      appendMeter(res[1] as Meter);
      addNotification('Mérőóra sikeresen hozzáadva.', 'success');
    },
    [addNotification, appendMeter, householdId, user],
  );

  const saveReading = useCallback(
    async (
      meterId: number,
      values: { date: string; value: string; isReset: boolean; isOfficial: boolean },
      editingReadingId: number | null,
    ) => {
      if (!canEditHousehold(user)) return;
      const payload = metersCalculations.buildReadingPayload({
        meterId,
        date: values.date,
        value: values.value,
        isReset: values.isReset,
        isOfficial: values.isOfficial,
      });

      if (editingReadingId !== null) {
        const res = await metersClient.updateReading(meterId, editingReadingId, payload);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
        patchMeter(meterId, res[1] as Meter);
        addNotification('Leolvasás frissítve.', 'success');
      } else {
        const res = await metersClient.addReading(meterId, payload);
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
          throw new Error('API Error');
        }
        patchMeter(meterId, res[1] as Meter);
        addNotification('Leolvasás rögzítve.', 'success');
      }
    },
    [addNotification, patchMeter, user],
  );

  const recordQuickReading = useCallback(
    async (meterId: number, inputValue: string) => {
      if (!canEditHousehold(user)) return;
      const meter = meters.find((m) => m.id === meterId);
      if (!meter) return;

      const sorted = [...meter.readings].sort((a, b) => (a.date < b.date ? 1 : -1));
      const latestReading = sorted[0];
      if (!latestReading) return;

      const currentVal = parseFloat(inputValue);
      if (Number.isNaN(currentVal)) return;

      const diff = metersCalculations.computeQuickReadingDiff(latestReading.value, currentVal);
      if (diff < 0) return;

      const payload = metersCalculations.buildReadingPayload({
        meterId,
        date: today(),
        value: inputValue,
        isReset: false,
        isOfficial: false,
      });
      const res = await metersClient.addReading(meterId, payload);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
        throw new Error('API Error');
      }
      patchMeter(meterId, res[1] as Meter);
      addNotification('Óraállás rögzítve.', 'success');
    },
    [addNotification, meters, patchMeter, user],
  );

  const deleteMeter = useCallback(
    async (id: number) => {
      const res = await metersClient.delete(id);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      removeMeter(id);
      addNotification('Mérőóra törölve.', 'success');
    },
    [addNotification, removeMeter],
  );

  const deleteReading = useCallback(
    async (meterId: number, readingId: number) => {
      const res = await metersClient.deleteReading(meterId, readingId);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      patchMeter(meterId, res[1] as Meter);
      addNotification('Leolvasás törölve.', 'success');
    },
    [addNotification, patchMeter],
  );

  const requestDeleteMeter = useCallback(
    (id: number) => {
      const m = meters.find((x) => x.id === id);
      requestDelete({
        title: 'Mérőóra törlése',
        message: `Biztosan törlöd a „${m?.name ?? 'mérőóra'}" mérőórát az összes állással együtt? Ez a művelet nem vonható vissza.`,
        onConfirm: () => deleteMeter(id),
      });
    },
    [deleteMeter, meters, requestDelete],
  );

  const requestDeleteReading = useCallback(
    (mId: number, rId: number) => {
      requestDelete({
        title: 'Leolvasás törlése',
        message: 'Biztosan törlöd ezt az óraállást? A fogyasztási adatok újraszámolásra kerülnek.',
        onConfirm: () => deleteReading(mId, rId),
      });
    },
    [deleteReading, requestDelete],
  );

  const deleteReadingsBulk = useCallback(
    async (meterId: number, readingIds: number[]) => {
      if (readingIds.length === 0) return;
      const res = await metersClient.deleteReadingsBulk(meterId, readingIds);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      patchMeter(meterId, res[1] as Meter);
      addNotification(`${readingIds.length} leolvasás törölve.`, 'success');
    },
    [addNotification, patchMeter],
  );

  const requestDeleteReadingsBulk = useCallback(
    (meterId: number, readingIds: number[]) => {
      if (readingIds.length === 0) return;
      requestDelete({
        title: `${readingIds.length} leolvasás törlése`,
        message: `Biztosan törlöd a kijelölt ${readingIds.length} óraállást? A fogyasztási adatok újraszámolásra kerülnek.`,
        onConfirm: () => deleteReadingsBulk(meterId, readingIds),
      });
    },
    [deleteReadingsBulk, requestDelete],
  );

  const estimateOneMonth = useCallback(
    async (meter: Meter, year: number, month: number): Promise<boolean> => {
      const targetDateStr = metersCalculations.targetDateForMonth(year, month);
      const sortedReadings = metersCalculations.sortReadingsByDate(meter.readings);

      if (metersCalculations.hasReadingForMonth(sortedReadings, year, month)) {
        return false;
      }

      const immediatePrev = metersCalculations.getImmediatePrevReading(sortedReadings, targetDateStr);
      if (!immediatePrev) {
        addNotification('Nincs korábbi leolvasás, amihez a becslést rögzíteni lehetne.', 'error');
        return false;
      }

      const { previous: prevAnchor, next: nextAnchor } = metersCalculations.bracketAnchorReadings(
        sortedReadings,
        targetDateStr,
      );

      if (prevAnchor && nextAnchor && metersCalculations.canInterpolateBetween(prevAnchor, nextAnchor)) {
        const payload = metersCalculations.buildInterpolationReading(prevAnchor, nextAnchor, year, month);
        const res = await metersClient.addReading(meter.id, payload);
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
          throw new Error('API Error');
        }
        patchMeter(meter.id, res[1] as Meter);
        return true;
      }

      const prevYearSameMonth = metersCalculations.getPreviousYearConsumption(meter, month, year);
      const historicalReadings = metersCalculations.buildHistoricalReadings(meter, targetDateStr);
      const prompt = metersCalculations.buildConsumptionEstimatePrompt(
        meter,
        year,
        month,
        prevYearSameMonth,
        historicalReadings,
      );

      let estimatedConsumption =
        (await aiHelpers.estimateMeterConsumption(prompt)) ??
        metersCalculations.seasonalConsumptionEstimate(historicalReadings, month, prevYearSameMonth);
      estimatedConsumption = Math.max(1, estimatedConsumption);

      const payload = {
        date: targetDateStr,
        month,
        year,
        value: metersCalculations.computeEstimatedReadingValue(immediatePrev, estimatedConsumption),
        is_reset: false,
        is_estimated: true,
      };
      const res = await metersClient.addReading(meter.id, payload);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
        throw new Error('API Error');
      }
      patchMeter(meter.id, res[1] as Meter);
      return true;
    },
    [addNotification, patchMeter],
  );

  const estimateAiMonth = useCallback(
    async (meterId: number, year: number, month: number) => {
      const meter = meters.find((m) => m.id === meterId);
      if (!meter) return;
      const ok = await estimateOneMonth(meter, year, month);
      if (!ok) {
        addNotification(
          'Erre a hónapra már van leolvasás. Becslés csak hiányzó hónapra készíthető.',
          'error',
        );
        return;
      }
      addNotification('AI becslés rögzítve.', 'success');
    },
    [addNotification, estimateOneMonth, meters],
  );

  const fillAllGaps = useCallback(
    async (meterId: number) => {
      const meter = meters.find((m) => m.id === meterId);
      if (!meter) return;

      const gaps = metersCalculations.listAllGapMonthsBetweenAnchors(
        metersCalculations.sortReadingsByDate(meter.readings),
      );
      if (gaps.length === 0) {
        addNotification(
          'Nincs kitölthető hiány: legalább két saját rögzítésű leolvasás között lehet interpolálni.',
          'info',
        );
        return;
      }

      for (const gap of gaps) {
        const payload = metersCalculations.buildInterpolationReading(gap.prev, gap.next, gap.year, gap.month);
        const res = await metersClient.addReading(meter.id, payload);
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
          throw new Error('API Error');
        }
        patchMeter(meter.id, res[1] as Meter);
      }
      addNotification(`${gaps.length} hiányzó hónap kitöltve.`, 'success');
    },
    [addNotification, meters, patchMeter],
  );

  return {
    user,
    isReader,
    pageLoading: loading && meters.length === 0,
    metersSettings,
    meters,
    selectedYear,
    selectedMonth,
    aiUtilityAnomalies,
    refreshAiAnomalies,
    canUseAi,
    canLoadAnomalies,
    locationGroups,
    getPreviousYearValue,
    createMeter,
    saveReading,
    recordQuickReading,
    estimateAiMonth,
    fillAllGaps,
    requestDeleteMeter,
    requestDeleteReading,
    requestDeleteReadingsBulk,
    ConfirmDeleteModal,
  };
}
