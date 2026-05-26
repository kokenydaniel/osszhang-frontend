import type { Meter, MeterReading } from '@/types';
import { metersClient } from '@/lib/api-client';
import {
  mapMeterFromApi,
  mapMetersFromApi,
  meterToApiPayload,
  readingToApiPayload,
  type CreateMeterPayload,
  type CreateReadingPayload,
  type RawMeter,
  type UpdateReadingPayload,
} from '@/mappers/meters.mapper';
import { isAbortError } from '@/lib/api-client/abortError';
import { compareDates, d } from '@/lib/dates';
import { Droplets, Flame, Gauge, Zap, type LucideIcon } from 'lucide-react';

export interface MetersFetchOptions {
  silent?: boolean;
}

export type MeterChartPoint = {
  monthName: string;
  idei: number | null;
  tavalyi: number | null;
};

export type GapMonth = {
  year: number;
  month: number;
  prev: MeterReading;
  next: MeterReading;
};

export interface MeterFormFields {
  name: string;
  unit: string;
  location: string;
}

export interface ReadingFormFields {
  meterId: number;
  date: string;
  value: string;
  isReset: boolean;
  isOfficial: boolean;
}

export type MeterMeta = {
  Icon: LucideIcon;
  iconBg: string;
  surface: string;
  bar: string;
  accent: string;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

class MetersService {
  private static _instance: MetersService | null = null;
  private abortController: AbortController | null = null;

  private constructor() {}

  static getInstance(): MetersService {
    if (!MetersService._instance) {
      MetersService._instance = new MetersService();
    }
    return MetersService._instance;
  }

  async fetchAll(options?: MetersFetchOptions): Promise<Meter[]> {
    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      const res = await metersClient.getAll({
        signal: this.abortController.signal,
        silent: options?.silent,
      });
      return mapMetersFromApi(res.data as RawMeter[]);
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.error('[MetersService] fetchAll failed', error);
      throw error;
    }
  }

  async create(payload: CreateMeterPayload): Promise<Meter> {
    const res = await metersClient.create(meterToApiPayload(payload) as CreateMeterPayload);
    return mapMeterFromApi(res.data as RawMeter);
  }

  async remove(id: number): Promise<void> {
    await metersClient.delete(id);
  }

  async addReading(meterId: number, payload: CreateReadingPayload): Promise<Meter> {
    const res = await metersClient.addReading(
      meterId,
      readingToApiPayload(payload) as Omit<MeterReading, 'id' | 'consumption'>,
    );
    return mapMeterFromApi(res.data as RawMeter);
  }

  async updateReading(meterId: number, readingId: number, payload: UpdateReadingPayload): Promise<Meter> {
    const res = await metersClient.updateReading(meterId, readingId, readingToApiPayload(payload));
    return mapMeterFromApi(res.data as RawMeter);
  }

  async removeReading(meterId: number, readingId: number): Promise<Meter> {
    const res = await metersClient.deleteReading(meterId, readingId);
    return mapMeterFromApi(res.data as RawMeter);
  }

  static isAnchorReading(r: MeterReading): boolean {
    return !(r.isEstimated ?? r.is_estimated);
  }

  static sortReadingsByDate(readings: MeterReading[]): MeterReading[] {
    return [...readings].sort((a, b) => compareDates(a.date, b.date) || a.id - b.id);
  }

  static monthKey(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  static targetDateForMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}-15`;
  }

  static bracketAnchorReadings(
    sorted: MeterReading[],
    targetDate: string,
  ): { previous: MeterReading | null; next: MeterReading | null } {
    const target = d(targetDate);
    const anchors = sorted.filter(MetersService.isAnchorReading);
    const previous = anchors.filter((r) => d(r.date).isBefore(target, 'day')).at(-1) ?? null;
    const next = anchors.find((r) => d(r.date).isAfter(target, 'day')) ?? null;
    return { previous, next };
  }

  static interpolateMeterValue(
    prev: { date: string; value: number },
    next: { date: string; value: number },
    targetDate: string,
  ): number {
    const prevMs = d(prev.date).valueOf();
    const nextMs = d(next.date).valueOf();
    const targetMs = d(targetDate).valueOf();
    if (nextMs <= prevMs) return Math.round(prev.value);
    const t = Math.min(1, Math.max(0, (targetMs - prevMs) / (nextMs - prevMs)));
    return Math.round(prev.value + (next.value - prev.value) * t);
  }

  static canInterpolateBetween(
    prev: { date: string; value: number },
    next: { date: string; value: number },
  ): boolean {
    return d(next.date).isAfter(d(prev.date), 'day') && next.value >= prev.value;
  }

  static seasonalConsumptionEstimate(
    historical: Array<{ month: number; consumption: number }>,
    targetMonth: number,
    prevYearSameMonth: number | null,
  ): number {
    const sameMonth = historical.filter((r) => r.month === targetMonth).map((r) => r.consumption);
    if (sameMonth.length > 0) {
      return Math.round(sameMonth.reduce((s, c) => s + c, 0) / sameMonth.length);
    }
    const lastSix = historical.slice(-6).map((r) => r.consumption);
    if (lastSix.length > 0) {
      const weights = lastSix.map((_, i) => i + 1);
      const weightedSum = lastSix.reduce((s, c, i) => s + c * weights[i], 0);
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      return Math.round(weightedSum / totalWeight);
    }
    if (prevYearSameMonth !== null) return Math.round(prevYearSameMonth);
    return 1;
  }

  static parseAiConsumption(answer: string): number | null {
    const digits = answer.replace(/[^0-9]/g, '');
    const n = parseInt(digits, 10);
    return isNaN(n) ? null : n;
  }

  static listMissingMonthsInGap(
    prev: { year: number; month: number },
    next: { year: number; month: number },
    existingKeys: Set<string>,
  ): Array<{ year: number; month: number }> {
    const missing: Array<{ year: number; month: number }> = [];
    let y = prev.year;
    let m = prev.month + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    while (y < next.year || (y === next.year && m < next.month)) {
      const key = MetersService.monthKey(y, m);
      if (!existingKeys.has(key)) missing.push({ year: y, month: m });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return missing;
  }

  static listAllGapMonthsBetweenAnchors(sorted: MeterReading[]): GapMonth[] {
    const anchors = sorted.filter(MetersService.isAnchorReading);
    const existingKeys = new Set(sorted.map((r) => MetersService.monthKey(r.year, r.month)));
    const result: GapMonth[] = [];

    for (let i = 0; i < anchors.length - 1; i++) {
      const left = anchors[i];
      const right = anchors[i + 1];
      const missing = MetersService.listMissingMonthsInGap(left, right, existingKeys);
      for (const slot of missing) {
        result.push({ ...slot, prev: left, next: right });
        existingKeys.add(MetersService.monthKey(slot.year, slot.month));
      }
    }
    return result;
  }

  static hasReadingForMonth(readings: MeterReading[], year: number, month: number): boolean {
    return readings.some((r) => r.year === year && r.month === month);
  }

  static getImmediatePrevReading(sorted: MeterReading[], targetDate: string): MeterReading | null {
    return sorted.filter((r) => d(r.date).isBefore(d(targetDate), 'day')).at(-1) ?? null;
  }

  static buildInterpolationReading(
    prev: MeterReading,
    next: MeterReading,
    year: number,
    month: number,
  ): CreateReadingPayload {
    const targetDateStr = MetersService.targetDateForMonth(year, month);
    return {
      date: targetDateStr,
      month,
      year,
      value: MetersService.interpolateMeterValue(prev, next, targetDateStr),
      isReset: false,
      isEstimated: true,
    };
  }

  static buildConsumptionEstimatePrompt(
    meter: Meter,
    year: number,
    month: number,
    prevYearSameMonth: number | null,
    historicalReadings: Array<{ month: number; consumption: number }>,
  ): string {
    const monthSeries = historicalReadings.map((r) => `${r.month}. hónap: ${r.consumption}`).join(', ');
    return `Becsüld meg egy közműóra (${meter.name}) havi fogyasztását (kWh vagy ${meter.unit}, különbség az előző és jelen állás között).
Célhónap: ${year}-${String(month).padStart(2, '0')}
Múlt év azonos hónapja: ${prevYearSameMonth !== null ? prevYearSameMonth : 'nincs'}
Korábbi havi fogyasztások (csak saját rögzítés): ${monthSeries || 'nincs'}

Válasz: egyetlen egész szám, semmi más.`;
  }

  static computeEstimatedReadingValue(immediatePrev: MeterReading, estimatedConsumption: number): number {
    return immediatePrev.value + Math.max(1, estimatedConsumption);
  }

  static getPreviousYearConsumption(meter: Meter, month: number, year: number): number | null {
    const py = meter.readings.find((r) => r.month === month && r.year === year - 1);
    return py ? py.consumption : null;
  }

  static buildHistoricalReadings(meter: Meter, targetDate: string): Array<{ month: number; consumption: number }> {
    return MetersService.sortReadingsByDate(meter.readings)
      .filter((r) => MetersService.isAnchorReading(r) && d(r.date).isBefore(d(targetDate), 'day'))
      .map((r) => ({ month: r.month, consumption: Math.max(0, r.consumption) }));
  }

  static buildMeterPayload(fields: MeterFormFields): CreateMeterPayload {
    return {
      name: fields.name,
      unit: fields.unit,
      location: fields.location,
    };
  }

  static buildReadingPayload(fields: ReadingFormFields): CreateReadingPayload {
    return {
      date: fields.date,
      month: d(fields.date).month() + 1,
      year: d(fields.date).year(),
      value: Number(fields.value),
      isReset: fields.isReset,
      isOfficial: fields.isOfficial,
      isEstimated: false,
    };
  }

  static buildChartData(
    meter: Meter,
    selectedYear: number,
    getPreviousYearValue: (meterId: number, month: number, currentYear: number) => number | null,
  ): MeterChartPoint[] {
    const result: MeterChartPoint[] = [];
    for (let m = 1; m <= 12; m++) {
      const cyData = meter.readings.find((r) => r.month === m && r.year === selectedYear);
      const pyData = getPreviousYearValue(meter.id, m, selectedYear);
      result.push({
        monthName: MONTH_NAMES[m - 1],
        idei: cyData ? cyData.consumption : null,
        tavalyi: pyData !== null ? pyData : null,
      });
    }
    return result;
  }

  static buildYearTotals(meter: Meter, selectedYear: number) {
    const yearReadings = meter.readings.filter((r) => r.year === selectedYear);
    const yearTotal = yearReadings.reduce((s, r) => s + r.consumption, 0);
    const prevYearTotal = meter.readings
      .filter((r) => r.year === selectedYear - 1)
      .reduce((s, r) => s + r.consumption, 0);
    const trend =
      prevYearTotal > 0 ? ((yearTotal - prevYearTotal) / prevYearTotal) * 100 : null;
    return { yearTotal, prevYearTotal, trend };
  }

  static buildConsumptionSinceOfficial(meter: Meter) {
    const sortedAllReadings = [...meter.readings].sort((a, b) => compareDates(b.date, a.date));
    const latestReading = sortedAllReadings[0];
    const sortedOfficialReadings = [...meter.readings]
      .filter((r) => r.isOfficial || r.is_official)
      .sort((a, b) => compareDates(b.date, a.date));
    const latestOfficialReading = sortedOfficialReadings[0];
    const consumptionSinceOfficial =
      latestReading && latestOfficialReading
        ? latestReading.value - latestOfficialReading.value
        : null;
    return { latestReading, latestOfficialReading, consumptionSinceOfficial };
  }

  static computeQuickReadingDiff(latestValue: number, inputValue: number): number {
    return inputValue - latestValue;
  }

  static groupByLocation(meters: Meter[]): Record<string, Meter[]> {
    return meters.reduce(
      (acc, meter) => {
        if (!acc[meter.location]) acc[meter.location] = [];
        acc[meter.location].push(meter);
        return acc;
      },
      {} as Record<string, Meter[]>,
    );
  }

  static getMeterMeta(name: string): MeterMeta {
    if (name.includes('Villany')) {
      return {
        Icon: Zap,
        iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
        surface: 'from-amber-50/70 via-amber-50/20',
        bar: 'bg-gradient-to-b from-amber-400 to-orange-500',
        accent: 'oklch(0.72 0.16 60)',
      };
    }
    if (name.includes('Víz')) {
      return {
        Icon: Droplets,
        iconBg: 'bg-gradient-to-br from-sky-400 to-cyan-500 text-white',
        surface: 'from-sky-50/70 via-sky-50/20',
        bar: 'bg-gradient-to-b from-sky-400 to-cyan-500',
        accent: 'oklch(0.62 0.16 200)',
      };
    }
    if (name.includes('Gáz')) {
      return {
        Icon: Flame,
        iconBg: 'bg-gradient-to-br from-rose-400 to-orange-500 text-white',
        surface: 'from-rose-50/70 via-rose-50/20',
        bar: 'bg-gradient-to-b from-rose-400 to-orange-500',
        accent: 'oklch(0.62 0.22 25)',
      };
    }
    return {
      Icon: Gauge,
      iconBg: 'bg-gradient-to-br from-primary to-violet-500 text-white',
      surface: 'from-primary/8 via-primary/2',
      bar: 'bg-gradient-to-b from-primary to-violet-500',
      accent: 'oklch(0.55 0.22 275)',
    };
  }
}

export const metersService = MetersService.getInstance();
export { MetersService };
