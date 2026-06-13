import { isImpersonating } from '@/helpers/impersonation-session';

/** Fix maszk — nem lehet az hosszából vagy csoportosításából következtetni az összegre. */
export const IMPERSONATION_MONEY_PLACEHOLDER = '****';

/** Megjelenített pénzösszeg maszkolása megszemélyesítés alatt. */
export function maskMoneyDisplayIfImpersonating(formatted: string): string {
  if (!isImpersonating()) return formatted;
  return IMPERSONATION_MONEY_PLACEHOLDER;
}

export function isImpersonationMoneyMasked(): boolean {
  return isImpersonating();
}
