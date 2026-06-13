import { debtsCalculations } from '@/calculations/debts';
import { yearMonthPrefix } from '@/utils/dates';
import type { Debt, DebtInstallmentPayment, UpdateDebtPayload } from '@/types/debts';

export type DebtInstallmentPaymentInput = {
  period: string;
  paidAt: string;
  amount: number;
  source: DebtInstallmentPayment['source'];
};

function legacyPayments(debt: Debt): DebtInstallmentPayment[] {
  return (debt.paidInstallmentMonths ?? []).map((period) => ({
    period,
    paidAt: null,
    amount: debt.minimumPayment ?? 0,
    source: 'budget' as const,
  }));
}

export function resolveInstallmentPayments(debt: Debt): DebtInstallmentPayment[] {
  const rows = debt.installmentPayments?.length ? debt.installmentPayments : legacyPayments(debt);
  return [...rows].sort((a, b) => b.period.localeCompare(a.period));
}

export function isInstallmentPeriodPaid(debt: Debt, year: number, month: number): boolean {
  const ym = yearMonthPrefix(year, month);
  return resolveInstallmentPayments(debt).some((p) => p.period === ym);
}

export function paidInstallmentMonthsFromPayments(payments: DebtInstallmentPayment[]): string[] {
  return [...new Set(payments.map((p) => p.period))].sort();
}

export function appendInstallmentPayment(
  debt: Debt,
  entry: DebtInstallmentPaymentInput,
  options?: { replacePeriod?: boolean },
): DebtInstallmentPayment[] {
  const base = debt.installmentPayments?.length ? [...debt.installmentPayments] : legacyPayments(debt);
  const next = options?.replacePeriod
    ? base.filter((p) => p.period !== entry.period)
    : base;
  next.push({
    period: entry.period,
    paidAt: entry.paidAt || null,
    amount: entry.amount,
    source: entry.source,
  });
  return next.sort((a, b) => b.period.localeCompare(a.period));
}

function installmentPaymentRows(debt: Debt): DebtInstallmentPayment[] {
  return debt.installmentPayments?.length ? [...debt.installmentPayments] : legacyPayments(debt);
}

export function removeInstallmentPaymentsForPeriod(
  debt: Debt,
  period: string,
): DebtInstallmentPayment[] {
  return installmentPaymentRows(debt).filter((p) => p.period !== period);
}

function sumRemovedAmount(debt: Debt, period: string): number {
  return installmentPaymentRows(debt)
    .filter((p) => p.period === period)
    .reduce((sum, p) => sum + p.amount, 0);
}

function paidAmountAfterRemoval(debt: Debt, removedTotal: number): Pick<UpdateDebtPayload, 'paidAmount' | 'status'> {
  const newPaid = Math.max(0, Number(debt.paidAmount) - removedTotal);
  const target = Number(debt.targetAmount);

  return {
    paidAmount: newPaid,
    status: debtsCalculations.deriveStatus(newPaid, target),
  };
}

export function buildDebtRemoveInstallmentPaymentUpdate(
  debt: Debt,
  payment: DebtInstallmentPayment,
): UpdateDebtPayload | null {
  const rows = installmentPaymentRows(debt);
  const index = rows.findIndex(
    (p) =>
      p.period === payment.period &&
      p.paidAt === payment.paidAt &&
      p.amount === payment.amount &&
      p.source === payment.source,
  );
  if (index < 0) return null;

  const removed = rows[index]!;
  const next = rows.filter((_, i) => i !== index);

  return {
    installmentPayments: next,
    paidInstallmentMonths: paidInstallmentMonthsFromPayments(next),
    ...paidAmountAfterRemoval(debt, removed.amount),
  };
}

export function findInstallmentPaymentsForPeriod(
  debt: Debt,
  year: number,
  month: number,
): DebtInstallmentPayment[] {
  const ym = yearMonthPrefix(year, month);
  return resolveInstallmentPayments(debt).filter((p) => p.period === ym);
}

export function resolveLastInstallmentPaidAt(debt: Debt): string | null {
  const dated = resolveInstallmentPayments(debt).filter((p) => p.paidAt);
  if (dated.length === 0) return null;
  return dated.sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))[0]?.paidAt ?? null;
}

export function formatInstallmentPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  const labels = [
    'január',
    'február',
    'március',
    'április',
    'május',
    'június',
    'július',
    'augusztus',
    'szeptember',
    'október',
    'november',
    'december',
  ];
  const idx = Number(month) - 1;
  return `${year}. ${labels[idx] ?? month}`;
}

export function installmentPaymentSourceLabel(source: DebtInstallmentPayment['source']): string {
  return source === 'debt_pay' ? 'Tartozások' : 'Költségvetés';
}

export function listMissedInstallmentPeriods(
  debt: Debt,
  throughYear: number,
  throughMonth: number,
): string[] {
  if (!debt.budgetSyncEnabled || !debt.budgetStartYear || !debt.budgetStartMonth) {
    return [];
  }

  const start = debt.budgetStartYear * 12 + debt.budgetStartMonth;
  const end = throughYear * 12 + throughMonth;
  const paid = new Set(resolveInstallmentPayments(debt).map((p) => p.period));
  const missed: string[] = [];

  for (let i = start; i <= end; i++) {
    const year = Math.floor((i - 1) / 12);
    const month = ((i - 1) % 12) + 1;
    const ym = yearMonthPrefix(year, month);
    if (!paid.has(ym)) missed.push(ym);
  }

  return missed.sort();
}

export function buildDebtInstallmentBudgetUpdate(
  debt: Debt,
  year: number,
  month: number,
  markPaid: boolean,
  paidAt: string,
): UpdateDebtPayload {
  const ym = yearMonthPrefix(year, month);
  const wasPaid = isInstallmentPeriodPaid(debt, year, month);
  const amount = debt.minimumPayment ?? 0;

  if (!markPaid) {
    const removedTotal = sumRemovedAmount(debt, ym);
    const payments = removeInstallmentPaymentsForPeriod(debt, ym);
    return {
      installmentPayments: payments,
      paidInstallmentMonths: paidInstallmentMonthsFromPayments(payments),
      ...paidAmountAfterRemoval(debt, removedTotal),
    };
  }

  const payments = appendInstallmentPayment(
    debt,
    { period: ym, paidAt, amount, source: 'budget' },
    { replacePeriod: true },
  );

  const payload: UpdateDebtPayload = {
    installmentPayments: payments,
    paidInstallmentMonths: paidInstallmentMonthsFromPayments(payments),
  };

  if (!wasPaid && amount > 0) {
    return { ...payload, ...debtsCalculations.buildPaymentUpdate(debt, amount) };
  }

  return payload;
}

export function buildDebtPayRecordUpdate(
  debt: Debt,
  year: number,
  month: number,
  amount: number,
  paidAt: string,
  syncBudgetMonth: boolean,
): UpdateDebtPayload {
  const ym = yearMonthPrefix(year, month);
  const payments = appendInstallmentPayment(
    debt,
    { period: ym, paidAt, amount, source: 'debt_pay' },
    { replacePeriod: false },
  );

  const payload: UpdateDebtPayload = {
    ...debtsCalculations.buildPaymentUpdate(debt, amount),
    installmentPayments: payments,
    paidInstallmentMonths: paidInstallmentMonthsFromPayments(payments),
  };

  if (syncBudgetMonth) {
    const months = new Set(payload.paidInstallmentMonths ?? []);
    months.add(ym);
    payload.paidInstallmentMonths = [...months].sort();
  }

  return payload;
}
