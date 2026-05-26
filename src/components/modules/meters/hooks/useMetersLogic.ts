'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentMonth, getCurrentYear, today } from '@/lib/dates';
import { useMetersStore } from '@/stores/useMetersStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useMetersUi } from '@/components/modules/meters/MetersUiContext';
import { metersService, MetersService } from '@/services/MetersService';
import { AiFinanceService } from '@/services/AiFinanceService';
import { resolveMetersSettings } from '@/lib/metersSettings';
import { canUseFeature } from '@/lib/checkAccess';
import { isHouseholdReader, canEditHousehold } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { isAbortError } from '@/lib/api-client/abortError';
import type { Meter, MeterReading } from '@/types';

export function useMetersLogic() {
  const { meters, isLoading, isLoaded, setMeters, setLoading, setLoaded, patchMeter, appendMeter, removeMeter } =
    useMetersStore();

  const ui = useMetersUi();
  const { user } = useAuthStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const pathname = usePathname();

  const metersSettings = useMemo(() => resolveMetersSettings(user?.household), [user?.household]);
  const isReader = isHouseholdReader(user);
  const canUseAi = canUseFeature(user, 'ai');

  useEffect(() => {
    if (!pathname.startsWith('/meters')) return;
    if (isLoaded || isLoading) return;

    let cancelled = false;
    const loadMeters = async () => {
      setLoading(true);
      try {
        const nextMeters = await metersService.fetchAll({ silent: true });
        if (!cancelled) {
          setMeters(nextMeters);
          setLoaded(true);
        }
      } catch (error) {
        if (!isAbortError(error) && !cancelled) {
          console.error('[useMetersLogic] fetch failed', error);
          setLoading(false);
        }
      }
    };

    void loadMeters();
    return () => {
      cancelled = true;
    };
  }, [pathname, isLoaded, isLoading, setLoading, setMeters, setLoaded]);

  useEffect(() => {
    if (!canUseAi) return;
    fetchAiUtilityAnomalies(selectedYear, selectedMonth);
  }, [canUseAi, fetchAiUtilityAnomalies, selectedMonth, selectedYear]);

  useEffect(() => {
    ui.setAiYear(selectedYear);
    ui.setAiMonth(selectedMonth);
  }, [selectedMonth, selectedYear, ui]);

  const getPreviousYearValue = useCallback(
    (mId: number, month: number, year: number): number | null => {
      const meter = meters.find((m) => m.id === mId);
      if (!meter) return null;
      return MetersService.getPreviousYearConsumption(meter, month, year);
    },
    [meters],
  );

  const locationGroups = useMemo(() => MetersService.groupByLocation(meters), [meters]);

  const openNewMeterModal = useCallback(() => {
    if (!canEditHousehold(user)) return;
    ui.openNewMeterModal(metersSettings);
  }, [metersSettings, ui, user]);

  const saveMeter = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!canEditHousehold(user)) return;

      try {
        const created = await metersService.create(
          MetersService.buildMeterPayload({
            name: ui.newMeterName,
            unit: ui.newMeterUnit,
            location: ui.newMeterLoc,
          }),
        );
        appendMeter(created);
        addNotification('Mérőóra létrehozva.', 'success');
        ui.closeNewMeterModal();
      } catch {
        addNotification('A mérőóra mentése nem sikerült.', 'error');
      }
    },
    [addNotification, appendMeter, ui, user],
  );

  const saveReading = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!canEditHousehold(user)) return;
      if (!ui.value) return;

      try {
        if (ui.editingReading) {
          const updated = await metersService.updateReading(
            ui.editingReading.meter.id,
            ui.editingReading.reading.id,
            {
              date: ui.date,
              value: Number(ui.value),
              isReset: ui.isReset,
              isOfficial: ui.isOfficial,
            },
          );
          patchMeter(ui.editingReading.meter.id, updated);
          addNotification('Leolvasás frissítve.', 'success');
        } else {
          const updated = await metersService.addReading(
            ui.meterId,
            MetersService.buildReadingPayload({
              meterId: ui.meterId,
              date: ui.date,
              value: ui.value,
              isReset: ui.isReset,
              isOfficial: ui.isOfficial,
            }),
          );
          patchMeter(ui.meterId, updated);
          addNotification('Leolvasás rögzítve.', 'success');
        }
        ui.closeReadingModal();
      } catch {
        addNotification('A leolvasás mentése nem sikerült.', 'error');
      }
    },
    [addNotification, patchMeter, ui, user],
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
      if (isNaN(currentVal)) return;

      const diff = MetersService.computeQuickReadingDiff(latestReading.value, currentVal);
      if (diff < 0) return;

      try {
        const updated = await metersService.addReading(meterId, {
          date: today(),
          month: getCurrentMonth(),
          year: getCurrentYear(),
          value: currentVal,
          isReset: false,
          isEstimated: false,
        });
        patchMeter(meterId, updated);
        ui.setCalcValue(meterId, '');
        addNotification('Óraállás rögzítve.', 'success');
      } catch {
        addNotification('Az óraállás rögzítése nem sikerült.', 'error');
      }
    },
    [addNotification, meters, patchMeter, ui, user],
  );

  const deleteMeter = useCallback(
    async (id: number) => {
      try {
        await metersService.remove(id);
        removeMeter(id);
        addNotification('Mérőóra törölve.', 'success');
      } catch {
        addNotification('A mérőóra törlése nem sikerült.', 'error');
      }
    },
    [addNotification, removeMeter],
  );

  const deleteReading = useCallback(
    async (meterId: number, readingId: number) => {
      try {
        const updated = await metersService.removeReading(meterId, readingId);
        patchMeter(meterId, updated);
        addNotification('Leolvasás törölve.', 'success');
      } catch {
        addNotification('A leolvasás törlése nem sikerült.', 'error');
      }
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

  const estimateOneMonth = useCallback(
    async (meter: Meter, year: number, month: number): Promise<boolean> => {
      const targetDateStr = MetersService.targetDateForMonth(year, month);
      const sortedReadings = MetersService.sortReadingsByDate(meter.readings);

      if (MetersService.hasReadingForMonth(sortedReadings, year, month)) {
        return false;
      }

      const immediatePrev = MetersService.getImmediatePrevReading(sortedReadings, targetDateStr);
      if (!immediatePrev) {
        addNotification('Nincs korábbi leolvasás, amihez a becslést rögzíteni lehetne.', 'error');
        return false;
      }

      const { previous: prevAnchor, next: nextAnchor } = MetersService.bracketAnchorReadings(
        sortedReadings,
        targetDateStr,
      );

      if (prevAnchor && nextAnchor && MetersService.canInterpolateBetween(prevAnchor, nextAnchor)) {
        const payload = MetersService.buildInterpolationReading(prevAnchor, nextAnchor, year, month);
        const updated = await metersService.addReading(meter.id, payload);
        patchMeter(meter.id, updated);
        return true;
      }

      const prevYearSameMonth = MetersService.getPreviousYearConsumption(meter, month, year);
      const historicalReadings = MetersService.buildHistoricalReadings(meter, targetDateStr);
      const prompt = MetersService.buildConsumptionEstimatePrompt(
        meter,
        year,
        month,
        prevYearSameMonth,
        historicalReadings,
      );

      let estimatedConsumption =
        (await AiFinanceService.estimateMeterConsumption(prompt)) ??
        MetersService.seasonalConsumptionEstimate(historicalReadings, month, prevYearSameMonth);
      estimatedConsumption = Math.max(1, estimatedConsumption);

      const updated = await metersService.addReading(meter.id, {
        date: targetDateStr,
        month,
        year,
        value: MetersService.computeEstimatedReadingValue(immediatePrev, estimatedConsumption),
        isReset: false,
        isEstimated: true,
      });
      patchMeter(meter.id, updated);
      return true;
    },
    [addNotification, patchMeter],
  );

  const estimateAiMonth = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const meter = meters.find((m) => m.id === ui.aiTargetMeter);
      if (!meter) return;

      ui.setIsAiLoading(true);
      try {
        const ok = await estimateOneMonth(meter, ui.aiYear, ui.aiMonth);
        if (!ok) {
          addNotification(
            'Erre a hónapra már van leolvasás. Becslés csak hiányzó hónapra készíthető.',
            'error',
          );
          return;
        }
        addNotification('AI becslés rögzítve.', 'success');
        ui.closeAiModal();
      } catch (err) {
        console.error(err);
        addNotification(
          'Hiba a becslés során. Ellenőrizd a hálózatot és az OPENAI_API_KEY beállítást.',
          'error',
        );
      } finally {
        ui.setIsAiLoading(false);
      }
    },
    [addNotification, estimateOneMonth, meters, ui],
  );

  const fillAllGaps = useCallback(async () => {
    const meter = meters.find((m) => m.id === ui.aiTargetMeter);
    if (!meter) return;

    const gaps = MetersService.listAllGapMonthsBetweenAnchors(
      MetersService.sortReadingsByDate(meter.readings),
    );
    if (gaps.length === 0) {
      addNotification(
        'Nincs kitölthető hiány: legalább két saját rögzítésű leolvasás között lehet interpolálni.',
        'info',
      );
      return;
    }

    ui.setIsAiLoading(true);
    try {
      for (const gap of gaps) {
        const payload = MetersService.buildInterpolationReading(gap.prev, gap.next, gap.year, gap.month);
        const updated = await metersService.addReading(meter.id, payload);
        patchMeter(meter.id, updated);
      }
      addNotification(`${gaps.length} hiányzó hónap kitöltve.`, 'success');
      ui.closeAiModal();
    } catch (err) {
      console.error(err);
      addNotification('Hiba a hiányzó hónapok kitöltésekor.', 'error');
    } finally {
      ui.setIsAiLoading(false);
    }
  }, [addNotification, meters, patchMeter, ui]);

  const openAiModal = useCallback(
    (meterId: number) => {
      ui.openAiModal(meterId);
    },
    [ui],
  );

  const openAddReading = useCallback(
    (meter: Meter) => {
      if (!canEditHousehold(user)) return;
      ui.openAddReading(meter);
    },
    [ui, user],
  );

  const openEditReading = useCallback(
    (meter: Meter, reading: MeterReading) => {
      ui.openEditReading(meter, reading);
    },
    [ui],
  );

  const applyMeterTemplate = useCallback(
    (template: (typeof metersSettings.templates)[number]) => {
      ui.applyMeterTemplate(template, metersSettings);
    },
    [metersSettings, ui],
  );

  return {
    isReader,
    metersSettings,
    meters,
    selectedYear,
    selectedMonth,
    aiUtilityAnomalies,
    fetchAiUtilityAnomalies,
    canUseAi,
    locationGroups,
    getPreviousYearValue,
    expandedHistory: ui.expandedHistory,
    expandedFullHistory: ui.expandedFullHistory,
    calcValues: ui.calcValues,
    toggleHistory: ui.toggleHistory,
    expandFullHistory: ui.expandFullHistory,
    setCalcValue: ui.setCalcValue,
    openNewMeterModal,
    saveMeter,
    applyMeterTemplate,
    saveReading,
    recordQuickReading,
    openAddReading,
    openEditReading,
    openAiModal,
    estimateAiMonth,
    fillAllGaps,
    isAiLoading: ui.isAiLoading,
    requestDeleteMeter,
    requestDeleteReading,
    ConfirmDeleteModal,
  };
}

export type MetersLogicResult = ReturnType<typeof useMetersLogic>;
