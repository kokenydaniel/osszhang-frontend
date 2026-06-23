

import { IMPERSONATION_MONEY_PLACEHOLDER, isImpersonationMoneyMasked } from '@/helpers/impersonation-money';

export const AAM_ANNUAL_LIMIT_HUF: Record<number, number> = {
  2024: 12_000_000,
  2025: 18_000_000,
  2026: 20_000_000,
  2027: 22_000_000,
  2028: 24_000_000,
};

const FALLBACK_BEFORE = 12_000_000;
const FALLBACK_STEP_AFTER_2028 = 2_000_000;

export function getAamAnnualLimitHuf(calendarYear: number): number {
  const direct = AAM_ANNUAL_LIMIT_HUF[calendarYear];
  if (direct != null) return direct;

  if (calendarYear < 2024) return FALLBACK_BEFORE;

  const anchorYear = 2028;
  const anchorLimit = AAM_ANNUAL_LIMIT_HUF[anchorYear];
  return anchorLimit + (calendarYear - anchorYear) * FALLBACK_STEP_AFTER_2028;
}

export function formatAamLimitShort(limit: number): string {
  if (isImpersonationMoneyMasked()) return IMPERSONATION_MONEY_PLACEHOLDER;
  if (limit >= 1_000_000) {
    const millions = limit / 1_000_000;
    return Number.isInteger(millions) ? `${millions} millió Ft` : `${millions.toFixed(1)} millió Ft`;
  }
  return `${limit.toLocaleString('hu-HU')} Ft`;
}
