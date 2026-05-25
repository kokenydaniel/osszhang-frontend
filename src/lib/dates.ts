import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/hu';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.locale('hu');

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_FORMAT = 'YYYY.MM.DD';
export const DISPLAY_FORMAT_LONG = 'YYYY. MM. DD.';

export type DateInput = string | Date | Dayjs | null | undefined;

export function d(value?: DateInput): Dayjs {
  if (value == null || value === '') return dayjs();
  if (dayjs.isDayjs(value)) return value;
  if (value instanceof Date) return dayjs(value);
  return dayjs(String(value).slice(0, 10));
}

export function today(): string {
  return dayjs().format(DATE_FORMAT);
}

export const localDateIso = today;

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parsed = d(dateStr);
  return parsed.isValid() ? parsed.format(DISPLAY_FORMAT) : '—';
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return '';
  const parsed = d(dateStr);
  return parsed.isValid() ? parsed.format(DISPLAY_FORMAT_LONG) : '';
}

const DATE_INPUT_FORMATS = [
  DATE_FORMAT,
  DISPLAY_FORMAT,
  DISPLAY_FORMAT_LONG,
  'YYYY.M.D',
  'YYYY.M.DD',
  'YYYY.MM.D',
  'D.M.YYYY',
  'D.MM.YYYY',
  'DD.M.YYYY',
  'DD.MM.YYYY',
  'D/M/YYYY',
  'DD/MM/YYYY',
  'D-M-YYYY',
  'DD-MM-YYYY',
] as const;

/** Parses free-form date text; returns ISO date, empty string, or null if invalid. */
export function parseDateInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  for (const fmt of DATE_INPUT_FORMATS) {
    const parsed = dayjs(trimmed, fmt, true);
    if (parsed.isValid()) return parsed.format(DATE_FORMAT);
  }

  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
    const parsed = d(trimmed);
    if (parsed.isValid()) return parsed.format(DATE_FORMAT);
  }

  return null;
}

export function datePart(dateStr: string): string {
  if (!dateStr) return '';
  const parsed = d(dateStr);
  return parsed.isValid() ? parsed.format(DATE_FORMAT) : String(dateStr).slice(0, 10);
}

export function isPastDueDate(dueDate: string, reference = today()): boolean {
  const due = d(dueDate);
  const ref = d(reference);
  if (!due.isValid() || !ref.isValid()) return false;
  return due.isBefore(ref, 'day');
}

export function hasSettlementDate(settledOn?: string | null): boolean {
  if (!settledOn) return false;
  const part = datePart(settledOn);
  return part.length >= 10 && d(part).isValid();
}

export function isDueOverdue(
  item: { dueDate: string; paidDate?: string | null },
  reference = today(),
): boolean {
  if (hasSettlementDate(item.paidDate)) return false;
  return isPastDueDate(item.dueDate, reference);
}

export function isOverdue(dateStr: string): boolean {
  return isPastDueDate(dateStr);
}

export function daysUntil(dateStr: string): number {
  return d(dateStr).startOf('day').diff(dayjs().startOf('day'), 'day');
}

export function getCurrentMonth(): number {
  return dayjs().month() + 1;
}

export function getCurrentYear(): number {
  return dayjs().year();
}

export function yearMonthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function matchesMonthYear(dateStr: string, month: number, year: number): boolean {
  const parsed = d(dateStr);
  return parsed.isValid() && parsed.month() + 1 === month && parsed.year() === year;
}

export function compareDates(a: string, b: string): number {
  return d(a).valueOf() - d(b).valueOf();
}

export function formatTodayLong(): string {
  return dayjs().format('YYYY. MMMM D., dddd');
}

export function toDateString(value: DateInput): string {
  return d(value).format(DATE_FORMAT);
}

export { dayjs };
