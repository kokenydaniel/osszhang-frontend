import { yearMonthPrefix } from '@/utils/dates';

/** Törölt szerződés: múltbeli hónapokban még látszik a költségvetésben, a törlés hónapjától nem. */
export function insuranceVisibleInBudgetMonth(
  policy: Pick<InsurancePolicy, 'deletedAt'>,
  year: number,
  month: number,
): boolean {
  if (!policy.deletedAt) return true;
  const deletedYm = policy.deletedAt.slice(0, 7);
  const targetYm = yearMonthPrefix(year, month);
  return targetYm < deletedYm;
}
import { matchPaymentCategory } from '@/settings/insurance';
import type { CashTransaction } from '@/types';
import type { InsurancePaymentFrequency, InsurancePolicy } from '@/types/insurance';

export const INSURANCE_BUDGET_ID_PREFIX = 'insurance-premium-';

export function insurancePremiumId(policyId: number, year: number, month: number): string {
  return `${INSURANCE_BUDGET_ID_PREFIX}${policyId}-${year}-${month}`;
}

export function parseInsurancePremiumId(
  id: string | number,
): { policyId: number; year: number; month: number } | null {
  if (typeof id !== 'string' || !id.startsWith(INSURANCE_BUDGET_ID_PREFIX)) return null;
  const rest = id.slice(INSURANCE_BUDGET_ID_PREFIX.length);
  const match = rest.match(/^(\d+)-(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  return { policyId: Number(match[1]), year: Number(match[2]), month: Number(match[3]) };
}

export function isInsurancePremiumTransaction(tx: Pick<CashTransaction, 'id'>): boolean {
  return typeof tx.id === 'string' && tx.id.startsWith(INSURANCE_BUDGET_ID_PREFIX);
}

export function paymentFrequencyMonths(freq: InsurancePaymentFrequency): number {
  switch (freq) {
    case 'monthly':
      return 1;
    case 'quarterly':
      return 3;
    case 'semiannual':
      return 6;
    case 'annual':
      return 12;
    default:
      return 12;
  }
}

export function paymentFrequencyLabel(freq: InsurancePaymentFrequency): string {
  switch (freq) {
    case 'monthly':
      return 'havi';
    case 'quarterly':
      return 'negyedéves';
    case 'semiannual':
      return 'féléves';
    case 'annual':
      return 'éves';
    default:
      return '';
  }
}

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

export function isInsurancePaymentMonth(
  startYear: number,
  startMonth: number,
  targetYear: number,
  targetMonth: number,
  frequency: InsurancePaymentFrequency,
): boolean {
  const interval = paymentFrequencyMonths(frequency);
  const start = monthIndex(startYear, startMonth);
  const target = monthIndex(targetYear, targetMonth);
  if (target < start) return false;
  return (target - start) % interval === 0;
}

function premiumDueDate(policy: InsurancePolicy, year: number, month: number): string {
  const day = Math.min(Math.max(policy.budgetDueDay ?? 1, 1), 28);
  return `${yearMonthPrefix(year, month)}-${String(day).padStart(2, '0')}`;
}

export function buildInsuranceBudgetExpenses(
  policies: InsurancePolicy[],
  year: number,
  month: number,
  categories: string[],
  categoryPattern: string,
): CashTransaction[] {
  const category = matchPaymentCategory(categories, categoryPattern);

  return policies
    .filter((policy) => {
      if (!insuranceVisibleInBudgetMonth(policy, year, month)) return false;
      if (!policy.isActive || policy.premiumFree) return false;
      if (!policy.budgetSyncEnabled || !policy.paymentAmount || policy.paymentAmount <= 0) return false;
      if (!policy.budgetStartYear || !policy.budgetStartMonth) return false;
      return isInsurancePaymentMonth(
        policy.budgetStartYear,
        policy.budgetStartMonth,
        year,
        month,
        policy.paymentFrequency,
      );
    })
    .map((policy) => {
      const ym = yearMonthPrefix(year, month);
      const paid = policy.paidBudgetPeriods?.includes(ym) ?? false;
      const dueDate = premiumDueDate(policy, year, month);
      return {
        id: insurancePremiumId(policy.id, year, month),
        walletId: null,
        type: 'expense',
        description: `${policy.name} — ${paymentFrequencyLabel(policy.paymentFrequency)} díj`,
        category,
        amount: policy.paymentAmount,
        dueDate,
        paidDate: paid ? dueDate : null,
        isBudget: false,
        isReserve: false,
      };
    });
}

export function withInsurancePeriodPaid(
  policy: InsurancePolicy,
  year: number,
  month: number,
): InsurancePolicy {
  const ym = yearMonthPrefix(year, month);
  const periods = new Set(policy.paidBudgetPeriods ?? []);
  periods.add(ym);
  return { ...policy, paidBudgetPeriods: [...periods].sort() };
}

export function withInsurancePeriodUnpaid(
  policy: InsurancePolicy,
  year: number,
  month: number,
): InsurancePolicy {
  const ym = yearMonthPrefix(year, month);
  return {
    ...policy,
    paidBudgetPeriods: (policy.paidBudgetPeriods ?? []).filter((p) => p !== ym),
  };
}
