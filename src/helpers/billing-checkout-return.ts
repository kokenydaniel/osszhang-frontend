const STORAGE_KEY = 'osszhang:billing-checkout-return';

export type BillingCheckoutReturnType = 'success' | 'canceled';

export function clearBillingCheckoutReturnFlags(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Returns true only the first time a given checkout return type is handled this session. */
export function consumeBillingCheckoutReturn(type: BillingCheckoutReturnType): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const handled = (raw ? JSON.parse(raw) : {}) as Partial<Record<BillingCheckoutReturnType, boolean>>;
    if (handled[type]) return false;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...handled, [type]: true }));
    return true;
  } catch {
    return true;
  }
}
