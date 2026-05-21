import type { MeterReading } from '@/types';
import { compareDates, d } from '@/lib/dates';

/** Saját rögzítés (nem AI-becsült) — ezek határozzák meg a becslési szakaszt. */
export function isAnchorReading(r: MeterReading): boolean {
  return !(r.isEstimated ?? r.is_estimated);
}

export function sortReadingsByDate(readings: MeterReading[]): MeterReading[] {
  return [...readings].sort(
    (a, b) => compareDates(a.date, b.date) || a.id - b.id,
  );
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function targetDateForMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-15`;
}

/** Megbízható leolvasások a cél dátum körül (interpolációhoz). */
export function bracketAnchorReadings(
  sorted: MeterReading[],
  targetDate: string,
): { previous: MeterReading | null; next: MeterReading | null } {
  const target = d(targetDate);
  const anchors = sorted.filter(isAnchorReading);
  const previous = anchors.filter((r) => d(r.date).isBefore(target, 'day')).at(-1) ?? null;
  const next = anchors.find((r) => d(r.date).isAfter(target, 'day')) ?? null;
  return { previous, next };
}

/** Időarányos óraállás két ismert pont között. */
export function interpolateMeterValue(
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

export function canInterpolateBetween(
  prev: { date: string; value: number },
  next: { date: string; value: number },
): boolean {
  return d(next.date).isAfter(d(prev.date), 'day') && next.value >= prev.value;
}

export function seasonalConsumptionEstimate(
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

export function parseAiConsumption(answer: string): number | null {
  const digits = answer.replace(/[^0-9]/g, '');
  const n = parseInt(digits, 10);
  return isNaN(n) ? null : n;
}

/** Kimaradt hónapok két horgony leolvasás között (év-hónap szerint). */
export function listMissingMonthsInGap(
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
    const key = monthKey(y, m);
    if (!existingKeys.has(key)) missing.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return missing;
}

export function listAllGapMonthsBetweenAnchors(
  sorted: MeterReading[],
): Array<{ year: number; month: number; prev: MeterReading; next: MeterReading }> {
  const anchors = sorted.filter(isAnchorReading);
  const existingKeys = new Set(sorted.map((r) => monthKey(r.year, r.month)));
  const result: Array<{ year: number; month: number; prev: MeterReading; next: MeterReading }> = [];

  for (let i = 0; i < anchors.length - 1; i++) {
    const left = anchors[i];
    const right = anchors[i + 1];
    const missing = listMissingMonthsInGap(left, right, existingKeys);
    for (const slot of missing) {
      result.push({ ...slot, prev: left, next: right });
      existingKeys.add(monthKey(slot.year, slot.month));
    }
  }
  return result;
}
