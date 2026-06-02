import type { SavingsAccount, Investment, LedgerEntry } from '@/types';
import { toDayjs, dayjs } from '@/utils/dates';

export interface InvestmentValueResult {
  totalValue: number;
  accruedInterest: number;
  daysPassed: number;
  isManualOverride: boolean;
}

export type SavingsGoalBudgetStatus = 'paid' | 'pending' | 'overdue';

export const savingsCalculations = {
  computeBalance(account: SavingsAccount): number {
    if (account.type === 'goal') {
      if (account.ledger.length === 0) return 0;
      return account.ledger.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
    }
    return account.ledger.reduce((sum, entry) => sum + entry.amount, 0);
  },

  computeInvestmentValue(inv: Investment): InvestmentValueResult {
    const purchase = toDayjs(inv.purchaseDate);
    const now = dayjs();
    const diffDays = Math.ceil(Math.max(0, now.diff(purchase, 'day')));

    if (inv.currentValue !== undefined && inv.currentValue !== null && Number(inv.currentValue) > 0) {
      const totalValue = Number(inv.currentValue);
      return {
        totalValue,
        accruedInterest: totalValue - Number(inv.principalAmount),
        daysPassed: diffDays,
        isManualOverride: true,
      };
    }

    const dailyRate = Number(inv.annualInterestRate) / 100 / 365.25;
    const accruedInterest = Number(inv.principalAmount) * diffDays * dailyRate;
    return {
      totalValue: Number(inv.principalAmount) + accruedInterest,
      accruedInterest,
      daysPassed: diffDays,
      isManualOverride: false,
    };
  },

  computeMaturityAmount(inv: Investment): number | null {
    if (inv.maturityAmount) return inv.maturityAmount;
    if (inv.name.toUpperCase().includes('DKJ') && inv.maturityDate) {
      const purchase = toDayjs(inv.purchaseDate);
      const maturity = toDayjs(inv.maturityDate);
      const diffDays = Math.ceil(Math.max(0, maturity.diff(purchase, 'day')));
      if (diffDays > 0) {
        const rate = Number(inv.annualInterestRate) / 100;
        return Math.round(Number(inv.principalAmount) * (1 + rate * (diffDays / 365.25)));
      }
    }
    return null;
  },

  goalProgress(currentAmount: number, goalAmount: number): number {
    if (goalAmount <= 0) return 0;
    return Math.min(100, Math.max(0, (currentAmount / goalAmount) * 100));
  },

  goalRemaining(currentAmount: number, goalAmount: number): number {
    return Math.max(0, goalAmount - currentAmount);
  },

  goalMonthsRemaining(targetDate: string, year: number, month: number): number {
    const monthStart = toDayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const targetEnd = toDayjs(targetDate).endOf('month');
    if (targetEnd.isBefore(monthStart, 'day')) return 0;

    const startY = monthStart.year();
    const startM = monthStart.month() + 1;
    const endY = targetEnd.year();
    const endM = targetEnd.month() + 1;

    return Math.max(1, (endY - startY) * 12 + (endM - startM) + 1);
  },

  ledgerSumBeforeMonth(ledger: LedgerEntry[], year: number, month: number): number {
    const monthStart = toDayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    return ledger
      .filter((entry) => toDayjs(entry.date).isBefore(monthStart, 'day'))
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  },

  goalPlannedForMonth(
    savedBeforeMonth: number,
    goalAmount: number,
    targetDate: string | null,
    year: number,
    month: number,
  ): number | null {
    if (!targetDate || goalAmount <= 0) return null;

    const monthStart = toDayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const targetEnd = toDayjs(targetDate).endOf('month');
    if (targetEnd.isBefore(monthStart, 'day')) return 0;

    const remaining = Math.max(0, goalAmount - savedBeforeMonth);
    if (remaining <= 0) return 0;

    const monthsLeft = savingsCalculations.goalMonthsRemaining(targetDate, year, month);
    return Math.round((remaining / monthsLeft) * 100) / 100;
  },

  goalMonthlyNeeded(
    ledger: LedgerEntry[],
    goalAmount: number,
    targetDate: string | null,
    year?: number,
    month?: number,
  ): number | null {
    const ref = toDayjs();
    const y = year ?? ref.year();
    const m = month ?? ref.month() + 1;
    const savedBefore = savingsCalculations.ledgerSumBeforeMonth(ledger, y, m);
    return savingsCalculations.goalPlannedForMonth(savedBefore, goalAmount, targetDate, y, m);
  },

  formatGoalDeadline(targetDate: string | null): string {
    if (!targetDate) return '—';
    return toDayjs(targetDate).format('YYYY. MMMM D.');
  },

  goalMonthlyHint(
    ledger: LedgerEntry[],
    goalAmount: number,
    targetDate: string | null,
    formatAmount: (n: number) => string,
    year?: number,
    month?: number,
  ): string | null {
    const monthly = savingsCalculations.goalMonthlyNeeded(ledger, goalAmount, targetDate, year, month);
    if (monthly === null) return null;
    if (monthly === 0) return 'A célösszeget már elérted — gratulálunk!';
    return `Havi ${formatAmount(monthly)}-ot kell félretenned a cél eléréséhez ${savingsCalculations.formatGoalDeadline(targetDate)}-ig.`;
  },

  goalActual(subItems?: LedgerEntry[]): number {
    return subItems?.reduce((acc, item) => acc + Math.abs(item.amount), 0) ?? 0;
  },

  goalIsFullyPaid(planned: number, actual: number): boolean {
    if (planned <= 0) return actual > 0;
    return actual >= planned;
  },

  goalBudgetStatus(
    planned: number,
    actual: number,
    dueDate: string,
    today: string,
  ): SavingsGoalBudgetStatus {
    if (savingsCalculations.goalIsFullyPaid(planned, actual)) return 'paid';
    if (today > dueDate) return 'overdue';
    return 'pending';
  },

  parseGoalDescription(description: string): string {
    return description.replace(/^Cél:\s*/, '');
  }
};
