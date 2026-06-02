import { dayjs, toDayjs, yearMonthPrefix } from '@/utils/dates';
import { matchPaymentCategory } from '@/settings/debts';
import type { CashTransaction } from '@/types';
import type { Debt } from '@/types/debts';

export const DEBT_BUDGET_ID_PREFIX = 'debt-installment-';

export function debtInstallmentId(debtId: number, year: number, month: number): string {
  return `${DEBT_BUDGET_ID_PREFIX}${debtId}-${year}-${month}`;
}

export function parseDebtInstallmentId(
  id: string | number,
): { debtId: number; year: number; month: number } | null {
  if (typeof id !== 'string' || !id.startsWith(DEBT_BUDGET_ID_PREFIX)) return null;
  const rest = id.slice(DEBT_BUDGET_ID_PREFIX.length);
  const match = rest.match(/^(\d+)-(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  return { debtId: Number(match[1]), year: Number(match[2]), month: Number(match[3]) };
}

export function isDebtInstallmentTransaction(tx: Pick<CashTransaction, 'id'>): boolean {
  return typeof tx.id === 'string' && tx.id.startsWith(DEBT_BUDGET_ID_PREFIX);
}

function installmentDueDate(debt: Debt, year: number, month: number): string {
  const day = Math.min(Math.max(debt.dueDay ?? 1, 1), 28);
  return `${yearMonthPrefix(year, month)}-${String(day).padStart(2, '0')}`;
}

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

export function buildDebtBudgetExpenses(
  debts: Debt[],
  year: number,
  month: number,
  categories: string[],
  categoryPattern: string,
): CashTransaction[] {
  const target = monthIndex(year, month);
  const category = matchPaymentCategory(categories, categoryPattern);

  return debts
    .filter((debt) => {
      if (!debt.budgetSyncEnabled || !debt.minimumPayment || debt.minimumPayment <= 0) return false;
      if (!debt.budgetStartYear || !debt.budgetStartMonth) return false;
      if (monthIndex(debt.budgetStartYear, debt.budgetStartMonth) > target) return false;
      const remaining = debt.targetAmount - debt.paidAmount;
      return remaining > 0;
    })
    .map((debt) => {
      const ym = yearMonthPrefix(year, month);
      const paid = debt.paidInstallmentMonths?.includes(ym) ?? false;
      const dueDate = installmentDueDate(debt, year, month);
      return {
        id: debtInstallmentId(debt.id, year, month),
        walletId: debt.walletId ?? null,
        type: 'expense',
        description: `${debt.name} — havi részlet`,
        category,
        amount: debt.minimumPayment ?? 0,
        dueDate,
        paidDate: paid ? dueDate : null,
        isBudget: false,
        isReserve: false,
      };
    });
}

export function withInstallmentMonthPaid(debt: Debt, year: number, month: number): Debt {
  const ym = yearMonthPrefix(year, month);
  const months = new Set(debt.paidInstallmentMonths ?? []);
  months.add(ym);
  return { ...debt, paidInstallmentMonths: [...months].sort() };
}

export function withInstallmentMonthUnpaid(debt: Debt, year: number, month: number): Debt {
  const ym = yearMonthPrefix(year, month);
  return {
    ...debt,
    paidInstallmentMonths: (debt.paidInstallmentMonths ?? []).filter((m) => m !== ym),
  };
}

export function isUpcomingWithinDays(dueDate: string, referenceDate: string, days = 3): boolean {
  const due = toDayjs(dueDate).startOf('day');
  const ref = toDayjs(referenceDate).startOf('day');
  const end = ref.add(days, 'day');
  return !due.isBefore(ref, 'day') && !due.isAfter(end, 'day');
}

export function isOverdueUnpaid(
  item: { dueDate: string; paidDate?: string | null },
  referenceDate: string,
): boolean {
  if (item.paidDate) return false;
  return toDayjs(item.dueDate).startOf('day').isBefore(toDayjs(referenceDate).startOf('day'), 'day');
}
