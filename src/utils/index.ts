import { MONTH_NAMES } from '@/types';

export {
  DATE_FORMAT,
  DISPLAY_FORMAT,
  DISPLAY_FORMAT_LONG,
  compareDates,
  datePart,
  toDayjs,
  dayjs,
  formatDate,
  formatDateLong,
  formatTodayLong,
  getCurrentMonth,
  getCurrentYear,
  hasSettlementDate,
  isDueOverdue,
  isOverdue,
  isPastDueDate,
  localDateIso,
  matchesMonthYear,
  today,
  toDateString,
  yearMonthPrefix,
} from '@/utils/dates';
export type { DateInput } from '@/utils/dates';

export { LoadableStatus, isStoreLoading, isNotFoundStatus } from '@/utils/loadable-status';
export { pickList } from '@/utils/pick-list';
export { fetchExchangeRates } from '@/utils/exchange-rates';
export { activeWalletManualBalance, resolveActiveWallet } from '@/utils/wallet-balance';
export { isHouseholdReader, canEditHousehold } from '@/utils/household-role';

export function formatHUF(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} M Ft`;
  }
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'HUF') return formatHUF(amount);
  if (currency === 'BTC') return `₿ ${amount.toFixed(6)}`;
  if (currency === 'ETH') return `Ξ ${amount.toFixed(4)}`;
  
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('hu-HU').format(n);
}

export function formatMonthYear(month: number, year: number): string {
  return `${year}. ${MONTH_NAMES[month]}`;
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[month] ?? '';
}

export function shortMonthName(month: number): string {
  const names: Record<number, string> = {
    1: 'Jan', 2: 'Feb', 3: 'Már', 4: 'Ápr',
    5: 'Máj', 6: 'Jún', 7: 'Júl', 8: 'Aug',
    9: 'Szep', 10: 'Okt', 11: 'Nov', 12: 'Dec',
  };
  return names[month] ?? '';
}

export function calcPercent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export const STATUS_COLORS = {
  rendben: 'badge-success',
  kint: 'badge-danger',
  szolgaltatonal: 'badge-warning',
} as const;

export const CATEGORY_COLORS = [
  '#7c6af7', '#22d3ee', '#f472b6', '#22c55e', '#f59e0b',
  '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];
