import { d } from '@/lib/dates';
import type { LedgerEntry } from '@/types';

export function ledgerSumBeforeMonth(ledger: LedgerEntry[], year: number, month: number): number {
  const monthStart = d(`${year}-${String(month).padStart(2, '0')}-01`);
  return ledger
    .filter((entry) => d(entry.date).isBefore(monthStart, 'day'))
    .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
}

export function savingsGoalMonthsRemaining(targetDate: string, year: number, month: number): number {
  const monthStart = d(`${year}-${String(month).padStart(2, '0')}-01`);
  const targetEnd = d(targetDate).endOf('month');
  if (targetEnd.isBefore(monthStart, 'day')) return 0;

  const startY = monthStart.year();
  const startM = monthStart.month() + 1;
  const endY = targetEnd.year();
  const endM = targetEnd.month() + 1;

  return Math.max(1, (endY - startY) * 12 + (endM - startM) + 1);
}

/** Ugyanaz a képlet, mint a backend SavingService::calculatePlannedMonthlyAmount */
export function savingsGoalPlannedForMonth(
  savedBeforeMonth: number,
  goalAmount: number,
  targetDate: string | null,
  year: number,
  month: number,
): number | null {
  if (!targetDate || goalAmount <= 0) return null;

  const monthStart = d(`${year}-${String(month).padStart(2, '0')}-01`);
  const targetEnd = d(targetDate).endOf('month');
  if (targetEnd.isBefore(monthStart, 'day')) return 0;

  const remaining = Math.max(0, goalAmount - savedBeforeMonth);
  if (remaining <= 0) return 0;

  const monthsLeft = savingsGoalMonthsRemaining(targetDate, year, month);
  return Math.round((remaining / monthsLeft) * 100) / 100;
}

export function savingsGoalProgress(currentAmount: number, goalAmount: number): number {
  if (goalAmount <= 0) return 0;
  return Math.min(100, Math.max(0, (currentAmount / goalAmount) * 100));
}

export function savingsGoalRemaining(currentAmount: number, goalAmount: number): number {
  return Math.max(0, goalAmount - currentAmount);
}

export function savingsGoalMonthlyNeeded(
  ledger: LedgerEntry[],
  goalAmount: number,
  targetDate: string | null,
  year?: number,
  month?: number,
): number | null {
  const ref = d();
  const y = year ?? ref.year();
  const m = month ?? ref.month() + 1;
  const savedBefore = ledgerSumBeforeMonth(ledger, y, m);
  return savingsGoalPlannedForMonth(savedBefore, goalAmount, targetDate, y, m);
}

export function formatSavingsGoalDeadline(targetDate: string | null): string {
  if (!targetDate) return '—';
  return d(targetDate).format('YYYY. MMMM D.');
}

export function savingsGoalMonthlyHint(
  ledger: LedgerEntry[],
  goalAmount: number,
  targetDate: string | null,
  formatAmount: (n: number) => string,
  year?: number,
  month?: number,
): string | null {
  const monthly = savingsGoalMonthlyNeeded(ledger, goalAmount, targetDate, year, month);
  if (monthly === null) return null;

  if (monthly === 0) {
    return 'A célösszeget már elérted — gratulálunk!';
  }

  return `Havi ${formatAmount(monthly)}-ot kell félretenned a cél eléréséhez ${formatSavingsGoalDeadline(targetDate)}-ig.`;
}

export function savingsGoalActual(subItems?: LedgerEntry[]): number {
  return subItems?.reduce((acc, item) => acc + Math.abs(item.amount), 0) ?? 0;
}

export function savingsGoalIsFullyPaid(planned: number, actual: number): boolean {
  if (planned <= 0) return actual > 0;
  return actual >= planned;
}

export type SavingsGoalBudgetStatus = 'paid' | 'pending' | 'overdue';

export function savingsGoalBudgetStatus(
  planned: number,
  actual: number,
  dueDate: string,
  today: string,
): SavingsGoalBudgetStatus {
  if (savingsGoalIsFullyPaid(planned, actual)) return 'paid';
  if (today > dueDate) return 'overdue';
  return 'pending';
}

export function parseGoalDescription(description: string): string {
  return description.replace(/^Cél:\s*/, '');
}
