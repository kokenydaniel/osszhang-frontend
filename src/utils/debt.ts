import { dayjs, d, today } from '@/lib/dates';

export interface PayoffResult {
  months: number | null;
  payoffDate: string | null;
  totalInterest: number | null;
  minimumViablePayment: number;
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
    return { months: 0, payoffDate: today(), totalInterest: 0, minimumViablePayment, isUnderwater: false };
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
  return dayjs().add(months, 'month').format('YYYY-MM-DD');
}

export function formatPayoffDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return d(iso).format('YYYY. MMM');
}

export function formatTerm(months: number | null | undefined): string {
  if (!months || months <= 0) return '—';
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years === 0) return `${months} hó`;
  if (remainder === 0) return `${years} év`;
  return `${years} év ${remainder} hó`;
}
