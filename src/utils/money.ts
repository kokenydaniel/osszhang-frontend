import { IMPERSONATION_MONEY_PLACEHOLDER, isImpersonationMoneyMasked } from '@/helpers/impersonation-money';
import { formatHUF } from '@/utils';

export function normalizeCurrency(currency?: string | null): string {
  const code = (currency || 'HUF').trim().toUpperCase();
  return code || 'HUF';
}

export function hufPerUnit(currency: string, rates: Record<string, number>): number {
  const code = normalizeCurrency(currency);
  if (code === 'HUF') return 1;
  const rate = rates[code];
  return rate && rate > 0 ? rate : 0;
}

export function toHuf(amount: number, currency: string | undefined, rates: Record<string, number>): number {
  const code = normalizeCurrency(currency);
  if (code === 'HUF') return amount;
  const perUnit = hufPerUnit(code, rates);
  if (!perUnit) return amount;
  return amount * perUnit;
}

export function toDefaultCurrency(
  amount: number,
  currency: string | undefined,
  defaultCurrency: string,
  rates: Record<string, number>,
): number {
  const target = normalizeCurrency(defaultCurrency);
  const huf = toHuf(amount, currency, rates);
  if (target === 'HUF') return huf;
  const perUnit = hufPerUnit(target, rates);
  return perUnit > 0 ? huf / perUnit : huf;
}

export function formatForeignAmount(amount: number, currency: string): string {
  if (isImpersonationMoneyMasked()) return IMPERSONATION_MONEY_PLACEHOLDER;
  const code = normalizeCurrency(currency);
  if (code === 'HUF') return formatHUF(amount);
  const formatted = new Intl.NumberFormat('hu-HU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${code}`;
}

export function formatTransactionAmount(
  amount: number,
  currency: string | undefined,
  rates: Record<string, number>,
): string {
  if (isImpersonationMoneyMasked()) return IMPERSONATION_MONEY_PLACEHOLDER;
  const code = normalizeCurrency(currency);
  if (code === 'HUF') return formatHUF(amount);
  const huf = toHuf(amount, code, rates);
  const hasRate = hufPerUnit(code, rates) > 0;
  if (!hasRate) {
    return `${formatForeignAmount(amount, code)} (árfolyam betöltése…)`;
  }
  return `${formatForeignAmount(amount, code)} (≈ ${formatHUF(Math.round(huf))})`;
}
