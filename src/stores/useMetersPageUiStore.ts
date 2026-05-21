import { create } from 'zustand';
import { Meter, MeterReading } from '@/types';
import { aiFinanceClient } from '@/lib/api-client';
import { useMetersStore } from './useMetersStore';
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
import type { MetersSettings } from '@/lib/metersSettings';
import { d, getCurrentMonth, getCurrentYear, today } from '@/lib/dates';

const todayIso = today;

interface MetersPageUiState {
  isModalOpen: boolean;
  editingReading: { meter: Meter; reading: MeterReading } | null;
  meterId: number;
  date: string;
  value: string;
  isReset: boolean;
  isOfficial: boolean;

  isAiModalOpen: boolean;
  isAiLoading: boolean;
  aiTargetMeter: number;
  aiYear: number;
  aiMonth: number;

  isNewMeterModalOpen: boolean;
  newMeterName: string;
  newMeterUnit: string;
  newMeterLoc: string;

  setIsModalOpen: (open: boolean) => void;
  setMeterId: (id: number) => void;
  setDate: (date: string) => void;
  setValue: (value: string) => void;
  setIsReset: (value: boolean) => void;
  setIsOfficial: (value: boolean) => void;
  setIsAiModalOpen: (open: boolean) => void;
  setAiYear: (year: number) => void;
  setAiMonth: (month: number) => void;
  setIsNewMeterModalOpen: (open: boolean) => void;
  setNewMeterName: (value: string) => void;
  setNewMeterUnit: (value: string) => void;
  setNewMeterLoc: (value: string) => void;

  openNewMeterModal: (metersSettings: MetersSettings) => void;
  applyMeterTemplate: (template: MetersSettings['templates'][number], metersSettings: MetersSettings) => void;
  handleMeterSubmit: (e: React.FormEvent) => void;
  handleSubmit: (e: React.FormEvent) => void;
  openEdit: (meter: Meter, reading: MeterReading) => void;
  handleAddReading: (meter: Meter) => void;
  handleAiClick: (id: number) => void;
  handleAiSubmit: (e: React.FormEvent, getPreviousYearValue: (mId: number, month: number, year: number) => number | null) => Promise<void>;
  handleFillAllGaps: (getPreviousYearValue: (mId: number, month: number, year: number) => number | null) => Promise<void>;
}

export const useMetersPageUiStore = create<MetersPageUiState>((set, get) => ({
  isModalOpen: false,
  editingReading: null,
  meterId: 0,
  date: todayIso(),
  value: '',
  isReset: false,
  isOfficial: false,

  isAiModalOpen: false,
  isAiLoading: false,
  aiTargetMeter: 1,
  aiYear: getCurrentYear(),
  aiMonth: getCurrentMonth(),

  isNewMeterModalOpen: false,
  newMeterName: '',
  newMeterUnit: 'kWh',
  newMeterLoc: '',

  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setMeterId: (meterId) => set({ meterId }),
  setDate: (date) => set({ date }),
  setValue: (value) => set({ value }),
  setIsReset: (isReset) => set({ isReset }),
  setIsOfficial: (isOfficial) => set({ isOfficial }),
  setIsAiModalOpen: (isAiModalOpen) => set({ isAiModalOpen }),
  setAiYear: (aiYear) => set({ aiYear }),
  setAiMonth: (aiMonth) => set({ aiMonth }),
  setIsNewMeterModalOpen: (isNewMeterModalOpen) => set({ isNewMeterModalOpen }),
  setNewMeterName: (newMeterName) => set({ newMeterName }),
  setNewMeterUnit: (newMeterUnit) => set({ newMeterUnit }),
  setNewMeterLoc: (newMeterLoc) => set({ newMeterLoc }),

  openNewMeterModal: (metersSettings) => {
    set({
      newMeterName: '',
      newMeterUnit: metersSettings.units[0] ?? 'kWh',
      newMeterLoc: metersSettings.default_location,
      isNewMeterModalOpen: true,
    });
  },

  applyMeterTemplate: (template, metersSettings) => {
    set({
      newMeterName: template.name,
      newMeterUnit: template.unit,
      newMeterLoc: template.location || metersSettings.default_location,
    });
  },

  handleMeterSubmit: (e) => {
    e.preventDefault();
    const { newMeterName, newMeterUnit, newMeterLoc } = get();
    void useMetersStore.getState().addMeter({ name: newMeterName, unit: newMeterUnit, location: newMeterLoc });
    set({ isNewMeterModalOpen: false, newMeterName: '' });
  },

  handleSubmit: (e) => {
    e.preventDefault();
    const { value, editingReading, meterId, date, isReset, isOfficial } = get();
    if (!value) return;
    const { addMeterReading, updateMeterReading } = useMetersStore.getState();
    if (editingReading) {
      void updateMeterReading(editingReading.meter.id, editingReading.reading.id, {
        date,
        value: Number(value),
        isReset,
        isOfficial,
      });
    } else {
      void addMeterReading(meterId, {
        date,
        month: d(date).month() + 1,
        year: d(date).year(),
        value: Number(value),
        isReset,
        isOfficial,
        isEstimated: false,
      });
    }
    set({ isModalOpen: false, value: '', isReset: false, isOfficial: false });
  },

  openEdit: (meter, reading) => {
    set({
      editingReading: { meter, reading },
      meterId: meter.id,
      date: reading.date,
      value: reading.value.toString(),
      isReset: reading.isReset,
      isOfficial: reading.isOfficial || false,
      isModalOpen: true,
    });
  },

  handleAddReading: (meter) => {
    set({
      editingReading: null,
      meterId: meter.id,
      value: '',
      date: todayIso(),
      isReset: false,
      isOfficial: false,
      isModalOpen: true,
    });
  },

  handleAiClick: (id) => set({ aiTargetMeter: id, isAiModalOpen: true }),

  handleAiSubmit: async (e, getPreviousYearValue) => {
    e.preventDefault();
    const { aiTargetMeter, aiYear, aiMonth } = get();
    const meters = useMetersStore.getState().meters;
    const meter = meters.find((m) => m.id === aiTargetMeter);
    if (!meter) return;
    set({ isAiLoading: true });
    try {
      const ok = await estimateOneMonth(meter, aiYear, aiMonth, getPreviousYearValue);
      if (!ok) {
        alert('Erre a hónapra már van leolvasás. Becslés csak hiányzó hónapra készíthető.');
        return;
      }
      set({ isAiModalOpen: false });
    } catch (err) {
      console.error(err);
      alert('Hiba a becslés során. Ellenőrizd a hálózatot és az OPENAI_API_KEY beállítást.');
    } finally {
      set({ isAiLoading: false });
    }
  },

  handleFillAllGaps: async (getPreviousYearValue) => {
    void getPreviousYearValue;
    const { aiTargetMeter } = get();
    const meters = useMetersStore.getState().meters;
    const meter = meters.find((m) => m.id === aiTargetMeter);
    if (!meter) return;
    const gaps = listAllGapMonthsBetweenAnchors(sortReadingsByDate(meter.readings));
    if (gaps.length === 0) {
      alert('Nincs kitölthető hiány: legalább két saját rögzítésű leolvasás között lehet interpolálni.');
      return;
    }
    set({ isAiLoading: true });
    try {
      const { addMeterReading } = useMetersStore.getState();
      for (const gap of gaps) {
        const targetDateStr = targetDateForMonth(gap.year, gap.month);
        const interpolated = interpolateMeterValue(gap.prev, gap.next, targetDateStr);
        await addMeterReading(meter.id, {
          date: targetDateStr,
          month: gap.month,
          year: gap.year,
          value: interpolated,
          isReset: false,
          isEstimated: true,
        });
      }
      set({ isAiModalOpen: false });
    } catch (err) {
      console.error(err);
      alert('Hiba a hiányzó hónapok kitöltésekor.');
    } finally {
      set({ isAiLoading: false });
    }
  },
}));

async function estimateOneMonth(
  meter: Meter,
  year: number,
  month: number,
  getPreviousYearValue: (mId: number, month: number, year: number) => number | null,
): Promise<boolean> {
  const targetDateStr = targetDateForMonth(year, month);
  const sortedReadings = sortReadingsByDate(meter.readings);

  if (sortedReadings.some((r) => r.year === year && r.month === month)) {
    return false;
  }

  const immediatePrev = sortedReadings.filter((r) => d(r.date).isBefore(d(targetDateStr), 'day')).at(-1) ?? null;
  if (!immediatePrev) {
    alert('Nincs korábbi leolvasás, amihez a becslést rögzíteni lehetne.');
    return false;
  }

  const { previous: prevAnchor, next: nextAnchor } = bracketAnchorReadings(sortedReadings, targetDateStr);

  if (prevAnchor && nextAnchor && canInterpolateBetween(prevAnchor, nextAnchor)) {
    const interpolated = interpolateMeterValue(prevAnchor, nextAnchor, targetDateStr);
    await useMetersStore.getState().addMeterReading(meter.id, {
      date: targetDateStr,
      month,
      year,
      value: interpolated,
      isReset: false,
      isEstimated: true,
    });
    return true;
  }

  const prevYearSameMonth = getPreviousYearValue(meter.id, month, year);
  const historicalReadings = sortedReadings
    .filter((r) => isAnchorReading(r) && d(r.date).isBefore(d(targetDateStr), 'day'))
    .map((r) => ({ month: r.month, consumption: Math.max(0, r.consumption) }));
  const monthSeries = historicalReadings.map((r) => `${r.month}. hónap: ${r.consumption}`).join(', ');

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
      parsed !== null ? parsed : seasonalConsumptionEstimate(historicalReadings, month, prevYearSameMonth);
  } catch {
    estimatedConsumption = seasonalConsumptionEstimate(historicalReadings, month, prevYearSameMonth);
  }
  estimatedConsumption = Math.max(1, estimatedConsumption);

  await useMetersStore.getState().addMeterReading(meter.id, {
    date: targetDateStr,
    month,
    year,
    value: immediatePrev.value + estimatedConsumption,
    isReset: false,
    isEstimated: true,
  });
  return true;
}
