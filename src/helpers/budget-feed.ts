import type { CashTransaction } from '@/types';
import { isDebtInstallmentTransaction } from '@/helpers/debt-budget';
import { isInsurancePremiumTransaction } from '@/helpers/insurance-budget';
import { isRentalIncomeTransaction } from '@/helpers/rental-budget';

/** Tartozás / biztosítás / bérbeadás szinkron sor — nem szerkeszthető és nem törölhető a költségvetésből. */
export function isExternallyManagedBudgetRow(id: string | number): boolean {
  if (typeof id !== 'string') return false;
  return (
    isInsurancePremiumTransaction({ id }) ||
    isDebtInstallmentTransaction({ id }) ||
    isRentalIncomeTransaction({ id })
  );
}

export interface BudgetTableItem {
  id: string | number;
  description: string;
  amount: number;
  currency?: string;
  dueDate: string;
  paidDate: string | null;
  isBill?: boolean;
  isSavingsGoal?: boolean;
  isBudget?: boolean;
  type?: 'income' | 'expense';
  subItems?: any[];
}

export function mapTransactionsToGroupedFeed(
  items: CashTransaction[],
  type: 'income' | 'expense',
  includeBills: boolean,
  categories: any[],
  monthlyBills: any[],
  getBillPortion: (bill: any) => number
): Record<string, BudgetTableItem[]> {
  const grouped: Record<string, BudgetTableItem[]> = {};

  // First, filter and group normal transactions
  for (const item of items) {

    const catName = item.category || 'Egyéb';
    if (!grouped[catName]) {
      grouped[catName] = [];
    }

    grouped[catName].push({
      id: item.id,
      description: item.description,
      amount: Math.abs(item.amount),
      currency: item.currency,
      dueDate: item.dueDate || '',
      paidDate: item.paidDate || null,
      isSavingsGoal: item.isSavingsGoal,
      isBudget: item.isBudget,
      type: item.type,
      subItems: item.subItems || [],
    });
  }

  // Include utility bills if applicable
  if (includeBills && type === 'expense') {
    for (const bill of monthlyBills) {
      const portion = getBillPortion(bill);
      if (portion <= 0) continue;

      const catName = 'Rezsi';
      if (!grouped[catName]) {
        grouped[catName] = [];
      }

      grouped[catName].push({
        id: `bill-${bill.id}`,
        description: bill.type || '',
        amount: portion,
        currency: 'HUF',
        dueDate: bill.dueDate || '',
        paidDate: bill.paidDate || null,
        isBill: true,
        type: 'expense',
      });
    }
  }

  return grouped;
}
