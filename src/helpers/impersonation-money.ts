import { isImpersonating } from '@/helpers/impersonation-session';

export const IMPERSONATION_MONEY_PLACEHOLDER = '****';

export function maskMoneyDisplayIfImpersonating(formatted: string): string {
  if (!isImpersonating()) return formatted;
  return IMPERSONATION_MONEY_PLACEHOLDER;
}

export function isImpersonationMoneyMasked(): boolean {
  return isImpersonating();
}
