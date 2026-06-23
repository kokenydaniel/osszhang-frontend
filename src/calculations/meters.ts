import type { Meter, MeterReading } from '@/types';
import type { CreateMeterPayload, CreateReadingPayload } from '@/types/meters';
import { compareDates, toDayjs } from '@/utils/dates';
import { Droplets, Flame, Gauge, Zap, type LucideIcon } from 'lucide-react';

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

export const metersCalculations = {
  isAnchorReading(r: MeterReading): boolean {
    return !r.is_estimated;
  },

  sortReadingsByDate(readings: MeterReading[]): MeterReading[] {
    return [...readings].sort((a, b) => compareDates(a.date, b.date) || a.id - b.id);
  },

  monthKey(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  },

  targetDateForMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}-15`;
  },

  bracketAnchorReadings(
    sorted: MeterReading[],
    targetDate: string,
  ): { previous: MeterReading | null; next: MeterReading | null } {
    const target = toDayjs(targetDate);
    const anchors = sorted.filter(metersCalculations.isAnchorReading);
    const previous = anchors.filter((r) => toDayjs(r.date).isBefore(target, 'day')).at(-1) ?? null;
    const next = anchors.find((r) => toDayjs(r.date).isAfter(target, 'day')) ?? null;
    return { previous, next };
  },

  interpolateMeterValue(
    prev: { date: string; value: number },
    next: { date: string; value: number },
    targetDate: string,
  ): number {
    const prevMs = toDayjs(prev.date).valueOf();
    const nextMs = toDayjs(next.date).valueOf();
    const targetMs = toDayjs(targetDate).valueOf();
    if (nextMs <= prevMs) return Math.round(prev.value);
    const t = Math.min(1, Math.max(0, (targetMs - prevMs) / (nextMs - prevMs)));
    return Math.round(prev.value + (next.value - prev.value) * t);
  },

  canInterpolateBetween(
    prev: { date: string; value: number },
    next: { date: string; value: number },
  ): boolean {
    return toDayjs(next.date).isAfter(toDayjs(prev.date), 'day') && next.value >= prev.value;
  },

  seasonalConsumptionEstimate(
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
  },

  parseAiConsumption(answer: string): number | null {
    const digits = answer.replace(/[^0-9]/g, '');
    const n = parseInt(digits, 10);
    return isNaN(n) ? null : n;
  },

  listMissingMonthsInGap(
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
      const key = metersCalculations.monthKey(y, m);
      if (!existingKeys.has(key)) missing.push({ year: y, month: m });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return missing;
  },

  listAllGapMonthsBetweenAnchors(sorted: MeterReading[]): GapMonth[] {
    const anchors = sorted.filter(metersCalculations.isAnchorReading);
    const existingKeys = new Set(sorted.map((r) => metersCalculations.monthKey(r.year, r.month)));
    const result: GapMonth[] = [];

    for (let i = 0; i < anchors.length - 1; i++) {
      const left = anchors[i];
      const right = anchors[i + 1];
      const missing = metersCalculations.listMissingMonthsInGap(left, right, existingKeys);
      for (const slot of missing) {
        result.push({ ...slot, prev: left, next: right });
        existingKeys.add(metersCalculations.monthKey(slot.year, slot.month));
      }
    }
    return result;
  },

  hasReadingForMonth(readings: MeterReading[], year: number, month: number): boolean {
    return readings.some((r) => r.year === year && r.month === month);
  },

  getImmediatePrevReading(sorted: MeterReading[], targetDate: string): MeterReading | null {
    return sorted.filter((r) => toDayjs(r.date).isBefore(toDayjs(targetDate), 'day')).at(-1) ?? null;
  },

  buildInterpolationReading(
    prev: MeterReading,
    next: MeterReading,
    year: number,
    month: number,
  ): CreateReadingPayload {
    const targetDateStr = metersCalculations.targetDateForMonth(year, month);
    return {
      date: targetDateStr,
      month,
      year,
      value: metersCalculations.interpolateMeterValue(prev, next, targetDateStr),
      is_reset: false,
      is_estimated: true,
    };
  },

  buildConsumptionEstimatePrompt(
    meter: Pick<Meter, 'name' | 'unit'>,
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
  },

  computeEstimatedReadingValue(immediatePrev: MeterReading, estimatedConsumption: number): number {
    return immediatePrev.value + Math.max(1, estimatedConsumption);
  },

  getPreviousYearConsumption(meter: Meter, month: number, year: number): number | null {
    const py = meter.readings.find((r) => r.month === month && r.year === year - 1);
    return py ? py.consumption : null;
  },

  buildHistoricalReadings(meter: Meter, targetDate: string): Array<{ month: number; consumption: number }> {
    return metersCalculations.sortReadingsByDate(meter.readings)
      .filter((r) => metersCalculations.isAnchorReading(r) && toDayjs(r.date).isBefore(toDayjs(targetDate), 'day'))
      .map((r) => ({ month: r.month, consumption: Math.max(0, r.consumption) }));
  },

  buildMeterPayload(fields: MeterFormFields): CreateMeterPayload {
    return {
      name: fields.name,
      unit: fields.unit,
      location: fields.location,
    };
  },

  buildReadingPayload(fields: ReadingFormFields): CreateReadingPayload {
    return {
      date: fields.date,
      month: toDayjs(fields.date).month() + 1,
      year: toDayjs(fields.date).year(),
      value: Number(fields.value),
      is_reset: fields.isReset,
      is_official: fields.isOfficial,
      is_estimated: false,
    };
  },

  buildChartData(
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
  },

  buildYearTotals(meter: Meter, selectedYear: number) {
    const yearReadings = meter.readings.filter((r) => r.year === selectedYear);
    const yearTotal = yearReadings.reduce((s, r) => s + r.consumption, 0);
    const prevYearTotal = meter.readings
      .filter((r) => r.year === selectedYear - 1)
      .reduce((s, r) => s + r.consumption, 0);
    const trend =
      prevYearTotal > 0 ? ((yearTotal - prevYearTotal) / prevYearTotal) * 100 : null;
    return { yearTotal, prevYearTotal, trend };
  },

  buildConsumptionSinceOfficial(meter: Meter) {
    const sortedAllReadings = [...meter.readings].sort((a, b) => compareDates(b.date, a.date));
    const latestReading = sortedAllReadings[0];
    const sortedOfficialReadings = [...meter.readings]
      .filter((r) => r.is_official || r.is_official)
      .sort((a, b) => compareDates(b.date, a.date));
    const latestOfficialReading = sortedOfficialReadings[0];
    const consumptionSinceOfficial =
      latestReading && latestOfficialReading
        ? latestReading.value - latestOfficialReading.value
        : null;
    return { latestReading, latestOfficialReading, consumptionSinceOfficial };
  },

  computeQuickReadingDiff(latestValue: number, inputValue: number): number {
    return inputValue - latestValue;
  },

  groupByLocation(meters: Meter[]): Record<string, Meter[]> {
    return meters.reduce(
      (acc, meter) => {
        if (!acc[meter.location]) acc[meter.location] = [];
        acc[meter.location].push(meter);
        return acc;
      },
      {} as Record<string, Meter[]>
    );
  },

  groupByLocationGroups(
    meters: Meter[],
    groups: Array<{ name: string; locations: string[] }>,
  ): Record<string, Meter[]> {
    if (!groups.length) {
      return this.groupByLocation(meters);
    }

    const acc: Record<string, Meter[]> = {};
    const normalize = (s: string) => s.trim().toLowerCase();

    for (const meter of meters) {
      const loc = (meter.location ?? '').trim();
      const locKey = normalize(loc);
      const matched = groups.find(
        (g) =>
          normalize(g.name) === locKey ||
          g.locations.some((l) => normalize(l) === locKey),
      );
      const key = matched?.name.trim() || loc || 'Nincs helyszín';
      if (!acc[key]) acc[key] = [];
      acc[key].push(meter);
    }

    return acc;
  },

  locationOptionsFromGroups(
    groups: Array<{ name: string; locations: string[] }>,
    defaultLocation: string,
  ): string[] {
    const out = new Set<string>();
    const def = defaultLocation.trim();
    if (def) out.add(def);
    for (const g of groups) {
      const name = g.name.trim();
      if (name) out.add(name);
      for (const loc of g.locations) {
        const l = loc.trim();
        if (l) out.add(l);
      }
    }
    return [...out];
  },

  getMeterMeta(name: string): MeterMeta {
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
};
