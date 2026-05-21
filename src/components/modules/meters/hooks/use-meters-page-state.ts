'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMetersStore } from '@/stores/useMetersStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveMetersSettings } from '@/lib/metersSettings';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { Meter, MeterReading } from '@/types';
import { aiFinanceClient } from '@/lib/api-client';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import {
  bracketAnchorReadings,
  canInterpolateBetween,
  interpolateMeterValue,
  isAnchorReading,
  listAllGapMonthsBetweenAnchors,
  parseAiConsumption,
  seasonalConsumptionEstimate,
  sortReadingsByDate,
  targetDateForMonth,
} from '@/lib/meterEstimation';

export function useMetersPageState() {
  const { user } = useAuthStore();
  const metersSettings = useMemo(() => resolveMetersSettings(user?.household), [user?.household]);
  const isReader = user?.role === 'reader';
  const { meters, addMeter, deleteMeter, addMeterReading, updateMeterReading, deleteMeterReading } = useMetersStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<{ meter: Meter; reading: MeterReading } | null>(null);

  const [meterId, setMeterId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [value, setValue] = useState('');
  const [isReset, setIsReset] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTargetMeter, setAiTargetMeter] = useState(1);
  const [aiYear, setAiYear] = useState(selectedYear);
  const [aiMonth, setAiMonth] = useState(selectedMonth);

  const [isNewMeterModalOpen, setIsNewMeterModalOpen] = useState(false);
  const [newMeterName, setNewMeterName] = useState('');
  const [newMeterUnit, setNewMeterUnit] = useState(metersSettings.units[0] ?? 'kWh');
  const [newMeterLoc, setNewMeterLoc] = useState(metersSettings.default_location);

  const openNewMeterModal = () => {
    setNewMeterName('');
    setNewMeterUnit(metersSettings.units[0] ?? 'kWh');
    setNewMeterLoc(metersSettings.default_location);
    setIsNewMeterModalOpen(true);
  };

  const applyMeterTemplate = (template: (typeof metersSettings.templates)[number]) => {
    setNewMeterName(template.name);
    setNewMeterUnit(template.unit);
    setNewMeterLoc(template.location || metersSettings.default_location);
  };

  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  useEffect(() => {
    fetchAiUtilityAnomalies(selectedYear, selectedMonth);
  }, [fetchAiUtilityAnomalies, selectedMonth, selectedYear]);

  const handleMeterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMeter({ name: newMeterName, unit: newMeterUnit, location: newMeterLoc });
    setIsNewMeterModalOpen(false);
    setNewMeterName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    if (editingReading) updateMeterReading(editingReading.meter.id, editingReading.reading.id, { date, value: Number(value), isReset, isOfficial });
    else addMeterReading(meterId, { date, month: new Date(date).getMonth() + 1, year: new Date(date).getFullYear(), value: Number(value), isReset, isOfficial, isEstimated: false });
    setIsModalOpen(false);
    setValue('');
    setIsReset(false);
    setIsOfficial(false);
  };

  const openEdit = (m: Meter, r: MeterReading) => {
    setEditingReading({ meter: m, reading: r });
    setMeterId(m.id);
    setDate(r.date);
    setValue(r.value.toString());
    setIsReset(r.isReset);
    setIsOfficial(r.isOfficial || false);
    setIsModalOpen(true);
  };

  const getPreviousYearValue = (mId: number, month: number, year: number): number | null => {
    const meter = meters.find((m) => m.id === mId);
    if (!meter) return null;
    const py = meter.readings.find((r) => r.month === month && r.year === year - 1);
    return py ? py.consumption : null;
  };

  const estimateOneMonth = async (meter: Meter, year: number, month: number): Promise<boolean> => {
    const targetDateStr = targetDateForMonth(year, month);
    const targetDate = new Date(targetDateStr);
    const sortedReadings = sortReadingsByDate(meter.readings);

    if (sortedReadings.some((r) => r.year === year && r.month === month)) {
      return false;
    }

    const immediatePrev = sortedReadings.filter((r) => new Date(r.date) < targetDate).at(-1) ?? null;
    if (!immediatePrev) {
      alert('Nincs korábbi leolvasás, amihez a becslést rögzíteni lehetne.');
      return false;
    }

    const { previous: prevAnchor, next: nextAnchor } = bracketAnchorReadings(sortedReadings, targetDate);

    if (
      prevAnchor &&
      nextAnchor &&
      canInterpolateBetween(prevAnchor, nextAnchor)
    ) {
      const value = interpolateMeterValue(prevAnchor, nextAnchor, targetDateStr);
      await addMeterReading(meter.id, {
        date: targetDateStr,
        month,
        year,
        value,
        isReset: false,
        isEstimated: true,
      });
      return true;
    }

    const prevYearSameMonth = getPreviousYearValue(meter.id, month, year);
    const historicalReadings = sortedReadings
      .filter((r) => isAnchorReading(r) && new Date(r.date) < targetDate)
      .map((r) => ({ month: r.month, consumption: Math.max(0, r.consumption) }));
    const monthSeries = historicalReadings
      .map((r) => `${r.month}. hónap: ${r.consumption}`)
      .join(', ');

    const prompt = `Becsüld meg egy közműóra (${meter.name}) havi fogyasztását (kWh vagy ${meter.unit}, különbség az előző és jelen állás között).
Célhónap: ${year}-${String(month).padStart(2, '0')}
Múlt év azonos hónapja: ${prevYearSameMonth !== null ? prevYearSameMonth : 'nincs'}
Korábbi havi fogyasztások (csak saját rögzítés): ${monthSeries || 'nincs'}

Válasz: egyetlen egész szám, semmi más.`;

    let estimatedConsumption: number;
    try {
      const res = await aiFinanceClient.query(prompt, false);
      const parsed = parseAiConsumption(res.data.answer);
      estimatedConsumption =
        parsed !== null
          ? parsed
          : seasonalConsumptionEstimate(historicalReadings, month, prevYearSameMonth);
    } catch {
      estimatedConsumption = seasonalConsumptionEstimate(historicalReadings, month, prevYearSameMonth);
    }
    estimatedConsumption = Math.max(1, estimatedConsumption);

    await addMeterReading(meter.id, {
      date: targetDateStr,
      month,
      year,
      value: immediatePrev.value + estimatedConsumption,
      isReset: false,
      isEstimated: true,
    });
    return true;
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const meter = meters.find((m) => m.id === aiTargetMeter);
    if (!meter) return;
    setIsAiLoading(true);
    try {
      const ok = await estimateOneMonth(meter, aiYear, aiMonth);
      if (!ok) {
        alert('Erre a hónapra már van leolvasás. Becslés csak hiányzó hónapra készíthető.');
        return;
      }
      setIsAiModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Hiba a becslés során. Ellenőrizd a hálózatot és az OPENAI_API_KEY beállítást.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFillAllGaps = async () => {
    const meter = meters.find((m) => m.id === aiTargetMeter);
    if (!meter) return;
    const gaps = listAllGapMonthsBetweenAnchors(sortReadingsByDate(meter.readings));
    if (gaps.length === 0) {
      alert('Nincs kitölthető hiány: legalább két saját rögzítésű leolvasás között lehet interpolálni.');
      return;
    }
    setIsAiLoading(true);
    try {
      for (const gap of gaps) {
        const targetDateStr = targetDateForMonth(gap.year, gap.month);
        const value = interpolateMeterValue(gap.prev, gap.next, targetDateStr);
        await addMeterReading(meter.id, {
          date: targetDateStr,
          month: gap.month,
          year: gap.year,
          value,
          isReset: false,
          isEstimated: true,
        });
      }
      setIsAiModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Hiba a hiányzó hónapok kitöltésekor.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiClick = (id: number) => {
    setAiTargetMeter(id);
    setIsAiModalOpen(true);
  };

  const handleAddReading = (m: Meter) => {
    setEditingReading(null);
    setMeterId(m.id);
    setValue('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsReset(false);
    setIsOfficial(false);
    setIsModalOpen(true);
  };

  const handleDeleteMeter = (id: number) => {
    const m = meters.find((x) => x.id === id);
    requestDelete({
      title: 'Mérőóra törlése',
      message: `Biztosan törlöd a „${m?.name ?? 'mérőóra'}" mérőórát az összes állással együtt? Ez a művelet nem vonható vissza.`,
      onConfirm: () => deleteMeter(id),
    });
  };

  const handleDeleteReading = (mId: number, rId: number) => {
    requestDelete({
      title: 'Leolvasás törlése',
      message: 'Biztosan törlöd ezt az óraállást? A fogyasztási adatok újraszámolásra kerülnek.',
      onConfirm: () => deleteMeterReading(mId, rId),
    });
  };

  const locationGroups = meters.reduce((acc, m) => {
    if (!acc[m.location]) acc[m.location] = [];
    acc[m.location].push(m);
    return acc;
  }, {} as Record<string, Meter[]>);

  return {
    isReader,
    metersSettings,
    meters,
    selectedYear,
    selectedMonth,
    aiUtilityAnomalies,
    fetchAiUtilityAnomalies,
    isModalOpen,
    setIsModalOpen,
    editingReading,
    meterId,
    setMeterId,
    date,
    setDate,
    value,
    setValue,
    isReset,
    setIsReset,
    isOfficial,
    setIsOfficial,
    isAiModalOpen,
    setIsAiModalOpen,
    isAiLoading,
    aiYear,
    setAiYear,
    aiMonth,
    setAiMonth,
    isNewMeterModalOpen,
    setIsNewMeterModalOpen,
    newMeterName,
    setNewMeterName,
    newMeterUnit,
    setNewMeterUnit,
    newMeterLoc,
    setNewMeterLoc,
    openNewMeterModal,
    applyMeterTemplate,
    handleMeterSubmit,
    handleSubmit,
    openEdit,
    getPreviousYearValue,
    handleAiSubmit,
    handleFillAllGaps,
    handleAiClick,
    handleAddReading,
    handleDeleteMeter,
    handleDeleteReading,
    locationGroups,
    ConfirmDeleteModal,
  };
}

export type MetersPageState = ReturnType<typeof useMetersPageState>;
