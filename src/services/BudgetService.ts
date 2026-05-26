import { budgetClient, householdClient } from '@/lib/api-client';
import { CashTransaction, LedgerEntry, UtilityBill, SavingsAccount, Investment } from '@/types';
import { hasSettlementDate, isDueOverdue, today as getTodayDate } from '@/utils';
import type { RequestOptions } from '@/lib/api-client/response';
import { SavingsService } from '@/services/SavingsService';

export interface BudgetCashflowMetrics {
  totalBalance: number;
  totalPending: number;
  unpaidReserves: number;
  disposableRemaining: number;
  overdueTotal: number;
  incomeReceived: number;
  spentThisMonth: number;
  monthlyBalance: number;
}

/** @deprecated Use BudgetCashflowMetrics */
export type UnifiedCashflowMetrics = BudgetCashflowMetrics & { lockedSavings?: number };

class BudgetServiceImpl {
  // --- I/O Operations ---

  async fetchAll(walletId: number, options?: RequestOptions) {
    return budgetClient.getAll(walletId, options);
  }

  async fetchGoalRows(walletId: number, month: number, year: number, options?: RequestOptions) {
    return budgetClient.getGoalRows(walletId, month, year, options);
  }

  async fetchPeriod(walletId: number, month: number, year: number, options?: RequestOptions) {
    return budgetClient.getForPeriod(walletId, month, year, options);
  }

  async createTransaction(data: Omit<CashTransaction, 'id'>) {
    return budgetClient.create(data);
  }

  async updateTransaction(id: number, data: Partial<Omit<CashTransaction, 'id' | 'subItems'>>) {
    return budgetClient.update(id, data);
  }

  async deleteTransaction(id: number) {
    return budgetClient.delete(id);
  }

  async addItem(txId: number | string, data: Omit<LedgerEntry, 'id'>) {
    return budgetClient.addItem(txId, data);
  }

  async deleteItem(txId: number | string, itemId: number) {
    return budgetClient.deleteItem(txId, itemId);
  }

  async cloneMonth(month: number, year: number, walletId: number) {
    return budgetClient.cloneMonth(month, year, walletId);
  }

  async updateCategories(categories: string[]) {
    return householdClient.updateCategories(categories);
  }

  // --- Domain Logic (Helpers) ---

  /**
   * Sums up all settled income transactions
   */
  calculateTotalIncomeReceived(incomes: CashTransaction[]): number {
    return incomes.filter((t) => hasSettlementDate(t.paidDate)).reduce((s, t) => s + t.amount, 0);
  }

  /**
   * Sums up actual spent amount (from settled expenses, ledger sub-items on budget rows, and settled bills)
   */
  calculateTotalActualSpent(expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number): number {
    const expensesSpent = expenses.reduce((s, t) => {
      if (t.isBudget && t.subItems && t.subItems.length > 0) {
        return s + t.subItems.reduce((acc, si) => acc + Math.abs(si.amount), 0);
      }
      return s + (hasSettlementDate(t.paidDate) ? t.amount : 0);
    }, 0);

    const billsSpent = monthlyBills.filter((b) => hasSettlementDate(b.paidDate)).reduce((s, b) => s + getBillPortion(b), 0);
    return expensesSpent + billsSpent;
  }

  /**
   * Sums up total projected expenses (all expenses + bills, regardless of settlement)
   */
  calculateTotalProjectedExpense(expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number): number {
    const expTotal = expenses.reduce((s, t) => s + t.amount, 0);
    const billsTotal = monthlyBills.reduce((s, b) => s + getBillPortion(b), 0);
    return expTotal + billsTotal;
  }

  /**
   * Calculates unpaid expenses (remaining budget amounts + unsettled one-off expenses + unsettled bills)
   */
  calculateUnpaidExpenses(expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number): number {
    const unpaidExp = expenses
      .filter((t) => !hasSettlementDate(t.paidDate))
      .reduce((s, t) => {
        if (t.isBudget) {
          const spent = t.subItems ? t.subItems.reduce((acc, si) => acc + Math.abs(si.amount), 0) : 0;
          return s + Math.max(0, t.amount - spent);
        }
        return s + t.amount;
      }, 0);

    const unpaidBills = monthlyBills.filter((b) => !hasSettlementDate(b.paidDate)).reduce((s, b) => s + getBillPortion(b), 0);
    return unpaidExp + unpaidBills;
  }

  /**
   * Calculates unsettled reserve amounts
   */
  calculateUnpaidReserves(reserves: CashTransaction[]): number {
    return reserves.filter((t) => !hasSettlementDate(t.paidDate)).reduce((s, t) => s + Math.abs(t.amount), 0);
  }

  /**
   * Calculates expenses that are past their due date
   */
  calculateOverdueExpenses(expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number): number {
    const today = getTodayDate();
    const overdueExp = expenses.filter((t) => isDueOverdue(t, today)).reduce((s, t) => s + t.amount, 0);
    const overdueBills = monthlyBills.filter((b) => isDueOverdue(b, today)).reduce((s, b) => s + getBillPortion(b), 0);
    return overdueExp + overdueBills;
  }

  /**
   * Groups expenses and bills by category, returning sorted array
   */
  groupTransactionsByCategory(categories: string[], expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number) {
    const allExpenseCategories = Array.from(new Set([...categories, ...expenses.map((e) => e.category || 'Egyéb')]));
    return allExpenseCategories
      .map((name) => {
        const amt = expenses.filter((e) => (e.category || 'Egyéb') === name).reduce((s, e) => s + e.amount, 0);
        const billAmt = name === 'Rezsi' ? monthlyBills.reduce((s, b) => s + getBillPortion(b), 0) : 0;
        return { name, value: amt + billAmt };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  calculateLockedSavings(
    savings: SavingsAccount[],
    investments: Investment[],
    exchangeRates: Record<string, number>,
  ): number {
    const toHuf = (amount: number, currency: string) => (exchangeRates[currency] || 1) * amount;

    const accountsTotal = savings
      .filter((acc) => acc.count_in_savings !== false)
      .reduce(
        (sum, acc) =>
          sum + toHuf(acc.ledger.reduce((ledgerSum, entry) => ledgerSum + entry.amount, 0), acc.currency),
        0,
      );

    const investmentsTotal = investments
      .filter((inv) => inv.countInSavings !== false)
      .reduce((sum, inv) => sum + SavingsService.computeInvestmentValue(inv).totalValue, 0);

    return Math.round(accountsTotal + investmentsTotal);
  }

  /**
   * Budget/Cashflow page metrics (single source of truth):
   * Fizetendő = unpaid expenses + bills; Marad = manual balance − fizetendő − unpaid reserves.
   */
  computeBudgetCashflowMetrics(params: {
    manualBalance: number;
    monthIncomes: CashTransaction[];
    monthExpenses: CashTransaction[];
    monthReserves: CashTransaction[];
    monthlyBills: UtilityBill[];
    getBillPortion: (b: UtilityBill) => number;
  }): BudgetCashflowMetrics {
    const { manualBalance, monthIncomes, monthExpenses, monthReserves, monthlyBills, getBillPortion } =
      params;

    const incomeReceived = this.calculateTotalIncomeReceived(monthIncomes);
    const spentThisMonth = this.calculateTotalActualSpent(monthExpenses, monthlyBills, getBillPortion);
    const totalPending = this.calculateUnpaidExpenses(monthExpenses, monthlyBills, getBillPortion);
    const unpaidReserves = this.calculateUnpaidReserves(monthReserves);
    const overdueTotal = this.calculateOverdueExpenses(monthExpenses, monthlyBills, getBillPortion);
    const totalBalance = Number(manualBalance);
    const disposableRemaining = totalBalance - totalPending - unpaidReserves;

    return {
      totalBalance: Math.round(totalBalance),
      totalPending: Math.round(totalPending),
      unpaidReserves: Math.round(unpaidReserves),
      disposableRemaining: Math.round(disposableRemaining),
      overdueTotal: Math.round(overdueTotal),
      incomeReceived: Math.round(incomeReceived),
      spentThisMonth: Math.round(spentThisMonth),
      monthlyBalance: Math.round(incomeReceived - spentThisMonth),
    };
  }
}

export const BudgetService = new BudgetServiceImpl();
