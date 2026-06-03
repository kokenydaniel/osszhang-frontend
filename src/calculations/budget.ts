import { CashTransaction, UtilityBill, SavingsAccount, Investment } from '@/types';
import { hasSettlementDate, isDueOverdue, today as getTodayDate } from '@/utils';
import { savingsCalculations } from '@/calculations/savings';
import { toHuf } from '@/utils/money';

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

type TxAmount = Pick<CashTransaction, 'amount' | 'currency' | 'subItems' | 'type' | 'isReserve' | 'isBudget' | 'paidDate'>;

function hufAmount(tx: Pick<CashTransaction, 'amount' | 'currency'>, rates: Record<string, number>): number {
  return toHuf(tx.amount, tx.currency, rates);
}

export const budgetCalculations = {
  ledgerSpentAmount(tx: Pick<CashTransaction, 'subItems'>, rates: Record<string, number>, currency?: string): number {
    const raw = tx.subItems?.reduce((acc, item) => acc + Math.abs(item.amount), 0) ?? 0;
    return toHuf(raw, currency, rates);
  },

  actualExpenseSpentAmount(tx: TxAmount, rates: Record<string, number>): number {
    if (tx.type !== 'expense' || tx.isReserve) return 0;
    if (tx.isBudget) {
      return this.ledgerSpentAmount(tx, rates, tx.currency);
    }
    return hasSettlementDate(tx.paidDate) ? hufAmount(tx, rates) : 0;
  },

  categorySummaryAmount(tx: TxAmount, rates: Record<string, number>): number {
    if (tx.type !== 'expense' || tx.isReserve) return 0;
    if (tx.isBudget) {
      return this.ledgerSpentAmount(tx, rates, tx.currency);
    }
    return hasSettlementDate(tx.paidDate) ? hufAmount(tx, rates) : 0;
  },

  calculateTotalIncomeReceived(incomes: CashTransaction[], rates: Record<string, number>): number {
    return incomes
      .filter((t) => hasSettlementDate(t.paidDate))
      .reduce((s, t) => s + hufAmount(t, rates), 0);
  },

  calculateTotalActualSpent(
    expenses: CashTransaction[],
    monthlyBills: UtilityBill[],
    getBillPortion: (b: UtilityBill) => number,
    rates: Record<string, number>,
  ): number {
    const expensesSpent = expenses.reduce((s, t) => s + this.actualExpenseSpentAmount(t, rates), 0);
    const billsSpent = monthlyBills
      .filter((b) => hasSettlementDate(b.paidDate))
      .reduce((s, b) => s + getBillPortion(b), 0);
    return expensesSpent + billsSpent;
  },

  calculateTotalProjectedExpense(
    expenses: CashTransaction[],
    monthlyBills: UtilityBill[],
    getBillPortion: (b: UtilityBill) => number,
    rates: Record<string, number>,
  ): number {
    const expTotal = expenses.reduce((s, t) => s + hufAmount(t, rates), 0);
    const billsTotal = monthlyBills.reduce((s, b) => s + getBillPortion(b), 0);
    return expTotal + billsTotal;
  },

  calculateUnpaidExpenses(
    expenses: CashTransaction[],
    monthlyBills: UtilityBill[],
    getBillPortion: (b: UtilityBill) => number,
    rates: Record<string, number>,
  ): number {
    const unpaidExp = expenses
      .filter((t) => !hasSettlementDate(t.paidDate))
      .reduce((s, t) => {
        if (t.isBudget) {
          const spent = this.ledgerSpentAmount(t, rates, t.currency);
          return s + Math.max(0, hufAmount(t, rates) - spent);
        }
        return s + hufAmount(t, rates);
      }, 0);

    const unpaidBills = monthlyBills
      .filter((b) => !hasSettlementDate(b.paidDate))
      .reduce((s, b) => s + getBillPortion(b), 0);
    return unpaidExp + unpaidBills;
  },

  calculateUnpaidReserves(reserves: CashTransaction[], rates: Record<string, number>): number {
    return reserves
      .filter((t) => !hasSettlementDate(t.paidDate))
      .reduce((s, t) => s + Math.abs(hufAmount(t, rates)), 0);
  },

  calculateOverdueExpenses(
    expenses: CashTransaction[],
    monthlyBills: UtilityBill[],
    getBillPortion: (b: UtilityBill) => number,
    rates: Record<string, number>,
  ): number {
    const today = getTodayDate();
    const overdueExp = expenses
      .filter((t) => isDueOverdue(t, today))
      .reduce((s, t) => s + hufAmount(t, rates), 0);
    const overdueBills = monthlyBills
      .filter((b) => isDueOverdue(b, today))
      .reduce((s, b) => s + getBillPortion(b), 0);
    return overdueExp + overdueBills;
  },

  groupTransactionsByCategory(
    categories: string[],
    expenses: CashTransaction[],
    monthlyBills: UtilityBill[],
    getBillPortion: (b: UtilityBill) => number,
    rates: Record<string, number>,
  ) {
    const allExpenseCategories = Array.from(new Set([...categories, ...expenses.map((e) => e.category || 'Egyéb')]));
    return allExpenseCategories
      .map((name) => {
        const amt = expenses
          .filter((e) => (e.category || 'Egyéb') === name)
          .reduce((s, e) => s + this.categorySummaryAmount(e, rates), 0);
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
    const accountsTotal = savings
      .filter((acc) => acc.count_in_savings !== false)
      .reduce(
        (sum, acc) =>
          sum +
          toHuf(
            acc.ledger.reduce((ledgerSum, entry) => ledgerSum + entry.amount, 0),
            acc.currency,
            exchangeRates,
          ),
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
    exchangeRates?: Record<string, number>;
  }): BudgetCashflowMetrics {
    const { manualBalance, monthIncomes, monthExpenses, monthReserves, monthlyBills, getBillPortion } =
      params;
    const rates = params.exchangeRates ?? { HUF: 1 };

    const incomeReceived = this.calculateTotalIncomeReceived(monthIncomes, rates);
    const spentThisMonth = this.calculateTotalActualSpent(monthExpenses, monthlyBills, getBillPortion, rates);
    const totalPending = this.calculateUnpaidExpenses(monthExpenses, monthlyBills, getBillPortion, rates);
    const unpaidReserves = this.calculateUnpaidReserves(monthReserves, rates);
    const overdueTotal = this.calculateOverdueExpenses(monthExpenses, monthlyBills, getBillPortion, rates);
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
  },
};
