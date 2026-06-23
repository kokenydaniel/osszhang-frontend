import type { SavingsAccount, Investment, LedgerEntry } from '@/types';
import { toDayjs, dayjs, toDateString } from '@/utils/dates';

export interface InvestmentValueResult {
  totalValue: number;
  accruedInterest: number;
  daysPassed: number;
  isManualOverride: boolean;
}

export type InvestmentPayoutEstimate = {
  amount: number;
  date: string | null;
  isEstimated: boolean;
  label: string;
};

export type InvestmentCardSupplementalRow = {
  label: string;
  amount: number | null;
  date?: string | null;
  hint?: string;
};

type InvestmentLike = Investment & {
  maturity_amount?: number | string | null;
  current_value?: number | string | null;
};

function bondNameUpper(name: string): string {
  return name.toUpperCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function isDkjName(name: string): boolean {
  return bondNameUpper(name).includes('DKJ');
}

function isFixMapName(name: string): boolean {
  const upper = bondNameUpper(name);
  return upper.includes('FIXMAP') || upper.includes('FIX MAP');
}

function isPmapName(name: string): boolean {
  return bondNameUpper(name).includes('PMAP');
}

export type SavingsGoalBudgetStatus = 'paid' | 'pending' | 'overdue';

export const savingsCalculations = {
  bondNameUpper,
  isDkjName,
  isFixMapName,
  isPmapName,

  normalizeInvestment(inv: Investment): Investment {
    const raw = inv as InvestmentLike;
    const maturityAmount = savingsCalculations.readExplicitMaturityAmount(inv);
    const currentRaw = raw.currentValue ?? raw.current_value;
    const currentValue =
      currentRaw === undefined || currentRaw === null || currentRaw === ''
        ? null
        : Number(currentRaw);

    return {
      ...inv,
      maturityAmount,
      currentValue: Number.isFinite(currentValue) && currentValue! > 0 ? currentValue : null,
    };
  },

  readExplicitMaturityAmount(inv: Investment): number | null {
    const raw = inv as InvestmentLike;
    const value = raw.maturityAmount ?? raw.maturity_amount;
    if (value === undefined || value === null || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
  },
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

  estimateMaturityFromTerms(inv: Investment): number | null {
    if (isDkjName(inv.name) && inv.maturityDate) {
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

  deriveAnnualRateFromMaturity(
    principal: number,
    maturityAmount: number,
    purchaseDate: string,
    maturityDate: string,
    fallbackRate: number,
  ): number {
    if (!(maturityAmount > 0 && purchaseDate && maturityDate)) return fallbackRate;
    const diffDays = Math.ceil(
      Math.max(0, toDayjs(maturityDate).diff(toDayjs(purchaseDate), 'day')),
    );
    if (diffDays <= 0 || principal <= 0 || maturityAmount <= principal) return fallbackRate;
    const totalReturnRatio = (maturityAmount - principal) / principal;
    return Math.round(totalReturnRatio * (365.25 / diffDays) * 100 * 100) / 100;
  },

  computeMaturityAmount(inv: Investment): number | null {
    const explicit = savingsCalculations.readExplicitMaturityAmount(inv);
    if (explicit != null) return explicit;

    const { totalValue, isManualOverride } = savingsCalculations.computeInvestmentValue(inv);
    const estimated = savingsCalculations.estimateMaturityFromTerms(inv);
    if (estimated != null && !(isManualOverride && estimated > totalValue * 1.5)) {
      return estimated;
    }
    return null;
  },

  investmentAmountBasis(inv: Investment): number {
    const maturity = savingsCalculations.computeMaturityAmount(inv);
    if (maturity != null && maturity > 0) return maturity;

    const { totalValue, isManualOverride } = savingsCalculations.computeInvestmentValue(inv);
    if (isManualOverride) return totalValue;
    return Number(inv.principalAmount) || 0;
  },

  estimateNextInvestmentPayout(inv: Investment): InvestmentPayoutEstimate | null {
    if (inv.nextPayoutAmount && inv.nextPayoutDate) {
      return {
        amount: inv.nextPayoutAmount,
        date: inv.nextPayoutDate,
        isEstimated: false,
        label: 'Következő kamat',
      };
    }

    const now = dayjs();
    const amountBasis = savingsCalculations.investmentAmountBasis(inv);

    if (isDkjName(inv.name)) {
      const maturityDate = inv.maturityDate ? toDayjs(inv.maturityDate) : null;
      return {
        amount: amountBasis,
        date: maturityDate ? toDateString(maturityDate) : null,
        isEstimated: true,
        label: 'Lejárati kifizetés',
      };
    }

    if (isFixMapName(inv.name)) {
      const yearlyRate = Number(inv.annualInterestRate) || 7;
      const currentYear = now.year();
      const payoutMonths = [0, 3, 6, 9];
      let nextPayoutDateObj = dayjs().year(currentYear).month(6).date(23);
      for (const m of payoutMonths) {
        const candidate = dayjs().year(currentYear).month(m).date(23);
        if (candidate.isAfter(now, 'day')) {
          nextPayoutDateObj = candidate;
          break;
        }
      }
      if (!nextPayoutDateObj.isAfter(now, 'day')) {
        nextPayoutDateObj = dayjs().year(currentYear + 1).month(0).date(23);
      }
      return {
        amount: Math.round((Number(amountBasis) * (yearlyRate / 100)) / 4),
        date: toDateString(nextPayoutDateObj),
        isEstimated: true,
        label: 'Következő kamat',
      };
    }

    if (isPmapName(inv.name)) {
      const maturity = inv.maturityDate ? toDayjs(inv.maturityDate) : null;
      const yearlyRate = Number(inv.annualInterestRate) || 0;
      let nextPayoutDateObj = dayjs();
      if (maturity) {
        const payMonth = maturity.month();
        const payDay = maturity.date();
        const currentYear = now.year();
        nextPayoutDateObj = dayjs().year(currentYear).month(payMonth).date(payDay);
        if (!nextPayoutDateObj.isAfter(now, 'day')) {
          nextPayoutDateObj = dayjs().year(currentYear + 1).month(payMonth).date(payDay);
        }
      } else {
        const purchase = toDayjs(inv.purchaseDate);
        nextPayoutDateObj = dayjs().year(now.year()).month(purchase.month()).date(purchase.date());
        if (!nextPayoutDateObj.isAfter(now, 'day')) {
          nextPayoutDateObj = dayjs().year(now.year() + 1).month(purchase.month()).date(purchase.date());
        }
      }
      return {
        amount: Math.round(Number(amountBasis) * (yearlyRate / 100)),
        date: toDateString(nextPayoutDateObj),
        isEstimated: true,
        label: 'Következő kamat',
      };
    }

    if (inv.maturityDate) {
      return {
        amount: amountBasis,
        date: inv.maturityDate,
        isEstimated: true,
        label: 'Lejárati kifizetés',
      };
    }

    return null;
  },

  getInvestmentCardSupplementalRows(inv: Investment): InvestmentCardSupplementalRow[] {
    const rows: InvestmentCardSupplementalRow[] = [];
    const explicit = savingsCalculations.readExplicitMaturityAmount(inv);

    if (explicit != null) {
      rows.push({ label: 'Lejáratkor (névérték)', amount: explicit, date: inv.maturityDate });
    }

    const payout = savingsCalculations.estimateNextInvestmentPayout(inv);
    if (payout?.label === 'Következő kamat') {
      rows.push({ label: 'Következő kamat', amount: payout.amount, date: payout.date });
    }

    if (explicit == null && isDkjName(inv.name) && inv.maturityDate) {
      const estimated = savingsCalculations.estimateMaturityFromTerms(inv);
      const { totalValue, isManualOverride } = savingsCalculations.computeInvestmentValue(inv);
      if (estimated != null && !(isManualOverride && estimated > totalValue * 1.5)) {
        rows.push({ label: 'Lejáratkor (becsült)', amount: estimated, date: inv.maturityDate });
      } else {
        rows.push({
          label: 'Lejáratkor (névérték)',
          amount: null,
          hint: 'Add meg a Lejárati névérték mezőt a szerkesztésben',
        });
      }
    }

    return rows;
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
