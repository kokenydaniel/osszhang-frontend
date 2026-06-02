import { CashTransaction, UtilityBill, SavingsAccount, Investment } from '@/types';
import { hasSettlementDate, isDueOverdue, today as getTodayDate } from '@/utils';
import { savingsCalculations } from '@/calculations/savings';

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

export type UnifiedCashflowMetrics = BudgetCashflowMetrics & { lockedSavings?: number };

export const budgetCalculations = {
  ledgerSpentAmount(tx: Pick<CashTransaction, 'subItems'>): number {
    return tx.subItems?.reduce((acc, item) => acc + Math.abs(item.amount), 0) ?? 0;
  },

  actualExpenseSpentAmount(tx: Pick<CashTransaction, 'type' | 'isReserve' | 'isBudget' | 'subItems' | 'paidDate' | 'amount'>): number {
    if (tx.type !== 'expense' || tx.isReserve) return 0;
    if (tx.isBudget) {
      return this.ledgerSpentAmount(tx);
    }
    return hasSettlementDate(tx.paidDate) ? tx.amount : 0;
  },

  /** Kategória összegzés és éves bontás: csak tényleges / kifizetett összegek. */
  categorySummaryAmount(
    tx: Pick<CashTransaction, 'type' | 'isReserve' | 'isBudget' | 'subItems' | 'paidDate' | 'amount'>,
  ): number {
    if (tx.type !== 'expense' || tx.isReserve) return 0;
    if (tx.isBudget) {
      return this.ledgerSpentAmount(tx);
    }
    return hasSettlementDate(tx.paidDate) ? tx.amount : 0;
  },

  calculateTotalIncomeReceived(incomes: CashTransaction[]): number {
    return incomes.filter((t) => hasSettlementDate(t.paidDate)).reduce((s, t) => s + t.amount, 0);
  },

  calculateTotalActualSpent(expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number): number {
    const expensesSpent = expenses.reduce((s, t) => s + this.actualExpenseSpentAmount(t), 0);
    const billsSpent = monthlyBills.filter((b) => hasSettlementDate(b.paidDate)).reduce((s, b) => s + getBillPortion(b), 0);
    return expensesSpent + billsSpent;
  },

  calculateTotalProjectedExpense(expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number): number {
    const expTotal = expenses.reduce((s, t) => s + t.amount, 0);
    const billsTotal = monthlyBills.reduce((s, b) => s + getBillPortion(b), 0);
    return expTotal + billsTotal;
  },

  calculateUnpaidExpenses(expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number): number {
    const unpaidExp = expenses
      .filter((t) => !hasSettlementDate(t.paidDate))
      .reduce((s, t) => {
        if (t.isBudget) {
          const spent = this.ledgerSpentAmount(t);
          return s + Math.max(0, t.amount - spent);
        }
        return s + t.amount;
      }, 0);

    const unpaidBills = monthlyBills.filter((b) => !hasSettlementDate(b.paidDate)).reduce((s, b) => s + getBillPortion(b), 0);
    return unpaidExp + unpaidBills;
  },

  calculateUnpaidReserves(reserves: CashTransaction[]): number {
    return reserves.filter((t) => !hasSettlementDate(t.paidDate)).reduce((s, t) => s + Math.abs(t.amount), 0);
  },

  calculateOverdueExpenses(expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number): number {
    const today = getTodayDate();
    const overdueExp = expenses.filter((t) => isDueOverdue(t, today)).reduce((s, t) => s + t.amount, 0);
    const overdueBills = monthlyBills.filter((b) => isDueOverdue(b, today)).reduce((s, b) => s + getBillPortion(b), 0);
    return overdueExp + overdueBills;
  },

  groupTransactionsByCategory(categories: string[], expenses: CashTransaction[], monthlyBills: UtilityBill[], getBillPortion: (b: UtilityBill) => number) {
    const allExpenseCategories = Array.from(new Set([...categories, ...expenses.map((e) => e.category || 'Egyéb')]));
    return allExpenseCategories
      .map((name) => {
        const amt = expenses
          .filter((e) => (e.category || 'Egyéb') === name)
          .reduce((s, e) => s + this.categorySummaryAmount(e), 0);
        const billAmt = name === 'Rezsi' ? monthlyBills.reduce((s, b) => s + getBillPortion(b), 0) : 0;
        return { name, value: amt + billAmt };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  },

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
      .reduce((sum, inv) => sum + savingsCalculations.computeInvestmentValue(inv).totalValue, 0);

    return Math.round(accountsTotal + investmentsTotal);
  },

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
};
