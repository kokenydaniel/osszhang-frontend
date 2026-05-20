/**
 * Standard amortization helpers for personal loans.
 *
 * Notation:
 *   P    - remaining principal (Ft)
 *   APR  - annual interest rate (%, e.g. 7.5)
 *   M    - monthly installment (Ft)
 *
 * Monthly rate r = APR / 100 / 12
 * Months left  n = -ln(1 - (P * r) / M) / ln(1 + r)        (when r > 0, M > P*r)
 *               n = P / M                                    (when r == 0)
 */

export interface PayoffResult {
  /** Months remaining (rounded up to whole months). `null` if not feasible. */
  months: number | null;
  /** Estimated payoff date (ISO string YYYY-MM-DD). `null` if not feasible. */
  payoffDate: string | null;
  /** Total interest paid over remaining term (Ft). `null` if not feasible. */
  totalInterest: number | null;
  /** Suggested minimum installment to actually cover the interest (Ft). */
  minimumViablePayment: number;
  /** True when the installment fails to cover interest (loan never finishes). */
  isUnderwater: boolean;
}

export function computePayoff(
  remaining: number,
  annualRatePercent: number | null | undefined,
  monthlyPayment: number | null | undefined,
): PayoffResult {
  const P = Math.max(0, Number(remaining) || 0);
  const apr = Math.max(0, Number(annualRatePercent) || 0);
  const M = Math.max(0, Number(monthlyPayment) || 0);
  const r = apr / 100 / 12;

  const minimumViablePayment = r > 0 ? Math.ceil(P * r) + 1 : 0;

  if (P <= 0) {
    return { months: 0, payoffDate: new Date().toISOString().split('T')[0], totalInterest: 0, minimumViablePayment, isUnderwater: false };
  }
  if (M <= 0) {
    return { months: null, payoffDate: null, totalInterest: null, minimumViablePayment, isUnderwater: true };
  }
  if (r === 0) {
    const n = Math.ceil(P / M);
    return {
      months: n,
      payoffDate: monthsFromNow(n),
      totalInterest: 0,
      minimumViablePayment: 0,
      isUnderwater: false,
    };
  }

  const monthlyInterest = P * r;
  if (M <= monthlyInterest) {
    return { months: null, payoffDate: null, totalInterest: null, minimumViablePayment, isUnderwater: true };
  }

  const n = -Math.log(1 - (P * r) / M) / Math.log(1 + r);
  const months = Math.ceil(n);
  const totalInterest = Math.round(months * M - P);

  return {
    months,
    payoffDate: monthsFromNow(months),
    totalInterest,
    minimumViablePayment,
    isUnderwater: false,
  };
}

/**
 * Compute the saving (months and interest) when overpaying the monthly installment
 * with a fixed extra amount.
 */
export interface AccelerationResult {
  monthsSaved: number;
  interestSaved: number;
  newPayoffDate: string;
  newTotalMonths: number;
}

export function computeAcceleration(
  remaining: number,
  annualRatePercent: number | null | undefined,
  monthlyPayment: number | null | undefined,
  extraMonthly: number,
): AccelerationResult | null {
  const base = computePayoff(remaining, annualRatePercent, monthlyPayment);
  if (!base.months || base.totalInterest === null) return null;
  const accelerated = computePayoff(remaining, annualRatePercent, (monthlyPayment || 0) + extraMonthly);
  if (!accelerated.months || accelerated.totalInterest === null) return null;
  return {
    monthsSaved: Math.max(0, base.months - accelerated.months),
    interestSaved: Math.max(0, base.totalInterest - accelerated.totalInterest),
    newPayoffDate: accelerated.payoffDate!,
    newTotalMonths: accelerated.months,
  };
}

function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

/** Format a payoff date for display: 'YYYY. MMM' (e.g. '2042. nov.') */
export function formatPayoffDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short' });
}

/** Format months as 'X év Y hó' (or 'Y hó' for less than 12). */
export function formatTerm(months: number | null | undefined): string {
  if (!months || months <= 0) return '—';
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years === 0) return `${months} hó`;
  if (remainder === 0) return `${years} év`;
  return `${years} év ${remainder} hó`;
}
