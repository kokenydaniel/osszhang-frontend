import type { SavingsAccount, Investment, AiSavingsPlan, LedgerEntry } from '@/types';
import {
  savingsClient,
  investmentsClient,
  aiFinanceClient,
} from '@/lib/api-client';
import {
  mapSavingsAccountFromApi,
  mapSavingsAccountsFromApi,
  savingsAccountToApiPayload,
  type RawSavingsAccount,
} from '@/mappers/savings.mapper';
import { unwrapApiData } from '@/lib/unwrapApiData';
import { isAbortError } from '@/lib/api-client/abortError';
import { d, dayjs } from '@/lib/dates';

// ─── Supporting Types ─────────────────────────────────────────────────────────

export interface SavingsFetchOptions {
  silent?: boolean;
  forceReload?: boolean;
}

export interface CreateSavingsPayload {
  type: 'account' | 'goal';
  institution: string;
  currency?: string;
  owner?: string;
  count_in_savings?: boolean;
  goalAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  walletId?: number | null;
}

export interface AiSavingsPlanPayload {
  goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
  constraints?: { min_buffer?: number };
  walletId?: number | null;
}

export interface InvestmentValueResult {
  totalValue: number;
  accruedInterest: number;
  daysPassed: number;
  isManualOverride: boolean;
}

export type SavingsGoalBudgetStatus = 'paid' | 'pending' | 'overdue';

// ─── Service Singleton ────────────────────────────────────────────────────────

/**
 * SavingsService — the single owner of all Savings domain I/O.
 *
 * Responsibilities:
 *  - Wraps `savingsClient`, `investmentsClient`, and `aiFinanceClient`
 *  - Applies `savings.mapper` internally; callers always receive typed frontend models
 *  - Manages fetch deduplication and abort control (not the Zustand store)
 *  - Exposes static pure helpers for domain computations (no I/O)
 *
 * Usage:
 *   import { savingsService } from '@/services/SavingsService';
 *   const accounts = await savingsService.fetchAll(walletId);
 *   const progress = SavingsService.goalProgress(saved, goal);
 */
class SavingsService {
  private static _instance: SavingsService | null = null;

  /** Abort controller for the active savings fetch; replaced on each new fetch. */
  private abortController: AbortController | null = null;
  /** Monotonically increasing counter to discard stale fetch responses. */
  private fetchSeq = 0;

  private constructor() {}

  static getInstance(): SavingsService {
    if (!SavingsService._instance) {
      SavingsService._instance = new SavingsService();
    }
    return SavingsService._instance;
  }

  // ── Savings Accounts ────────────────────────────────────────────────────────

  /**
   * Fetches all savings accounts for the given wallet.
   * Returns the mapped accounts and the sequence number so callers can detect
   * race conditions (discard if seq !== current).
   */
  async fetchAll(
    walletId: number,
    options?: SavingsFetchOptions,
  ): Promise<{ accounts: SavingsAccount[]; seq: number }> {
    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const seq = ++this.fetchSeq;

    try {
      const res = await savingsClient.getAll(walletId, {
        signal,
        silent: options?.silent,
      });

      return {
        accounts: mapSavingsAccountsFromApi(res.data as RawSavingsAccount[]),
        seq,
      };
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.error('[SavingsService] fetchAll failed', error);
      throw error;
    }
  }

  /** Returns the current internal sequence number (for caller-side race detection). */
  get currentSeq(): number {
    return this.fetchSeq;
  }

  async create(payload: CreateSavingsPayload): Promise<SavingsAccount> {
    const res = await savingsClient.create(savingsAccountToApiPayload(payload));
    return mapSavingsAccountFromApi(res.data as RawSavingsAccount);
  }

  async update(
    id: number,
    partial: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>,
  ): Promise<SavingsAccount> {
    const res = await savingsClient.update(
      id,
      savingsAccountToApiPayload(partial) as Partial<Omit<SavingsAccount, 'id' | 'ledger'>>,
    );
    return mapSavingsAccountFromApi(res.data as RawSavingsAccount);
  }

  async remove(id: number): Promise<void> {
    await savingsClient.delete(id);
  }

  // ── Ledger Entries ──────────────────────────────────────────────────────────

  async addEntry(savingsId: number, entry: Omit<LedgerEntry, 'id'>): Promise<SavingsAccount> {
    const res = await savingsClient.addEntry(savingsId, entry);
    return mapSavingsAccountFromApi(res.data as RawSavingsAccount);
  }

  async updateEntry(
    savingsId: number,
    entryId: number,
    entry: Partial<Omit<LedgerEntry, 'id'>>,
  ): Promise<SavingsAccount> {
    const res = await savingsClient.updateEntry(savingsId, entryId, entry);
    return mapSavingsAccountFromApi(res.data as RawSavingsAccount);
  }

  async removeEntry(savingsId: number, entryId: number): Promise<SavingsAccount> {
    const res = await savingsClient.deleteEntry(savingsId, entryId);
    return mapSavingsAccountFromApi(res.data as RawSavingsAccount);
  }

  // ── Investments ─────────────────────────────────────────────────────────────

  async fetchInvestments(options?: SavingsFetchOptions): Promise<Investment[]> {
    const res = await investmentsClient.getAll({ silent: options?.silent });
    return res.data;
  }

  async createInvestment(data: Omit<Investment, 'id'>): Promise<Investment> {
    const res = await investmentsClient.create(data);
    return res.data;
  }

  async updateInvestment(
    id: number,
    data: Partial<Omit<Investment, 'id'>>,
  ): Promise<Investment> {
    const res = await investmentsClient.update(id, data);
    return res.data;
  }

  async removeInvestment(id: number): Promise<void> {
    await investmentsClient.delete(id);
  }

  // ── AI ──────────────────────────────────────────────────────────────────────

  async fetchAiPlan(payload: AiSavingsPlanPayload): Promise<AiSavingsPlan> {
    const res = await aiFinanceClient.getSavingsRecommendations({
      goals: payload.goals,
      constraints: payload.constraints,
      ...(payload.walletId != null ? { wallet_id: payload.walletId } : {}),
    });
    return unwrapApiData<AiSavingsPlan>(res.data);
  }

  // ── Static Domain Helpers (pure, no I/O) ───────────────────────────────────
  // These replace the functions formerly in lib/savingsGoals.ts.

  /**
   * Computes the current balance of a savings account from its ledger.
   * - For regular accounts: signed sum of all entries (deposits positive, withdrawals negative)
   * - For goals: unsigned sum (progress toward goal)
   */
  static computeBalance(account: SavingsAccount): number {
    if (account.type === 'goal') {
      if (account.ledger.length === 0) return 0;
      return account.ledger.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
    }
    return account.ledger.reduce((sum, entry) => sum + entry.amount, 0);
  }

  /**
   * Computes the current and accrued value of an investment based on its
   * principal, annual interest rate, and elapsed days. If a manual
   * currentValue override is set, uses that instead.
   */
  static computeInvestmentValue(inv: Investment): InvestmentValueResult {
    const purchase = d(inv.purchaseDate);
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
  }

  /**
   * Returns the maturity amount for an investment, if determinable.
   * Falls back to calculating from DKJ bonds based on purchase/maturity dates.
   */
  static computeMaturityAmount(inv: Investment): number | null {
    if (inv.maturityAmount) return inv.maturityAmount;
    if (inv.name.toUpperCase().includes('DKJ') && inv.maturityDate) {
      const purchase = d(inv.purchaseDate);
      const maturity = d(inv.maturityDate);
      const diffDays = Math.ceil(Math.max(0, maturity.diff(purchase, 'day')));
      if (diffDays > 0) {
        const rate = Number(inv.annualInterestRate) / 100;
        return Math.round(Number(inv.principalAmount) * (1 + rate * (diffDays / 365.25)));
      }
    }
    return null;
  }

  // ── Goal Computation Helpers ────────────────────────────────────────────────

  /** Returns the goal completion percentage (0–100), clamped. */
  static goalProgress(currentAmount: number, goalAmount: number): number {
    if (goalAmount <= 0) return 0;
    return Math.min(100, Math.max(0, (currentAmount / goalAmount) * 100));
  }

  /** Returns how much is still needed to reach the goal. */
  static goalRemaining(currentAmount: number, goalAmount: number): number {
    return Math.max(0, goalAmount - currentAmount);
  }

  /** Returns how many months remain from the given year/month until the target date. */
  static goalMonthsRemaining(targetDate: string, year: number, month: number): number {
    const monthStart = d(`${year}-${String(month).padStart(2, '0')}-01`);
    const targetEnd = d(targetDate).endOf('month');
    if (targetEnd.isBefore(monthStart, 'day')) return 0;

    const startY = monthStart.year();
    const startM = monthStart.month() + 1;
    const endY = targetEnd.year();
    const endM = targetEnd.month() + 1;

    return Math.max(1, (endY - startY) * 12 + (endM - startM) + 1);
  }

  /** Returns the sum of ledger entries strictly before the given month. */
  static ledgerSumBeforeMonth(ledger: LedgerEntry[], year: number, month: number): number {
    const monthStart = d(`${year}-${String(month).padStart(2, '0')}-01`);
    return ledger
      .filter((entry) => d(entry.date).isBefore(monthStart, 'day'))
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  }

  /**
   * Returns the planned monthly contribution for this month to stay on track.
   * Mirrors the backend SavingService::calculatePlannedMonthlyAmount logic.
   */
  static goalPlannedForMonth(
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

    const monthsLeft = SavingsService.goalMonthsRemaining(targetDate, year, month);
    return Math.round((remaining / monthsLeft) * 100) / 100;
  }

  /** Returns the monthly amount needed from today to hit the goal by target date. */
  static goalMonthlyNeeded(
    ledger: LedgerEntry[],
    goalAmount: number,
    targetDate: string | null,
    year?: number,
    month?: number,
  ): number | null {
    const ref = d();
    const y = year ?? ref.year();
    const m = month ?? ref.month() + 1;
    const savedBefore = SavingsService.ledgerSumBeforeMonth(ledger, y, m);
    return SavingsService.goalPlannedForMonth(savedBefore, goalAmount, targetDate, y, m);
  }

  /** Formats the goal deadline as a human-readable string. */
  static formatGoalDeadline(targetDate: string | null): string {
    if (!targetDate) return '—';
    return d(targetDate).format('YYYY. MMMM D.');
  }

  /**
   * Returns a human-readable hint about how much to save each month.
   * Returns null if no target date or goal amount is set.
   */
  static goalMonthlyHint(
    ledger: LedgerEntry[],
    goalAmount: number,
    targetDate: string | null,
    formatAmount: (n: number) => string,
    year?: number,
    month?: number,
  ): string | null {
    const monthly = SavingsService.goalMonthlyNeeded(ledger, goalAmount, targetDate, year, month);
    if (monthly === null) return null;
    if (monthly === 0) return 'A célösszeget már elérted — gratulálunk!';
    return `Havi ${formatAmount(monthly)}-ot kell félretenned a cél eléréséhez ${SavingsService.formatGoalDeadline(targetDate)}-ig.`;
  }

  /** Returns the total amount paid into a goal via budget sub-items. */
  static goalActual(subItems?: LedgerEntry[]): number {
    return subItems?.reduce((acc, item) => acc + Math.abs(item.amount), 0) ?? 0;
  }

  static goalIsFullyPaid(planned: number, actual: number): boolean {
    if (planned <= 0) return actual > 0;
    return actual >= planned;
  }

  static goalBudgetStatus(
    planned: number,
    actual: number,
    dueDate: string,
    today: string,
  ): SavingsGoalBudgetStatus {
    if (SavingsService.goalIsFullyPaid(planned, actual)) return 'paid';
    if (today > dueDate) return 'overdue';
    return 'pending';
  }

  static parseGoalDescription(description: string): string {
    return description.replace(/^Cél:\s*/, '');
  }
}

// Export the singleton instance for I/O operations
export const savingsService = SavingsService.getInstance();

// Export the class itself for static method access (pure domain computations)
export { SavingsService };
