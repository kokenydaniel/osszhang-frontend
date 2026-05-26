import { CashTransaction, LedgerEntry, UtilityBill } from '@/types';

export interface BudgetTableItem {
  id: number | string;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  isBill?: boolean;
  isBudget?: boolean;
  isSavingsGoal?: boolean;
  subItems?: LedgerEntry[];
  type?: 'income' | 'expense';
}

/**
 * Maps raw transactions and utility bills into a grouped feed suitable for the Budget Table.
 */
export function mapTransactionsToGroupedFeed(
  items: CashTransaction[],
  type: 'income' | 'expense',
  includeBills: boolean,
  categories: string[],
  monthlyBills: UtilityBill[],
  getBillPortion: (b: UtilityBill) => number,
): Record<string, BudgetTableItem[]> {
  const allCats = Array.from(new Set([...categories, ...items.map((i) => i.category || 'Egyéb')]));
  
  return allCats.reduce((acc, cat) => {
    let filtered: BudgetTableItem[] = items
      .filter((i) => (i.category || 'Egyéb') === cat)
      .map((i) => ({
        id: i.id,
        description: i.description,
        category: i.category,
        amount: i.amount,
        dueDate: i.dueDate,
        paidDate: i.paidDate,
        isBudget: i.isBudget,
        isSavingsGoal: i.isSavingsGoal,
        subItems: i.subItems,
        type: i.type,
      }));

    if (cat === 'Rezsi' && type === 'expense' && includeBills) {
      const billItems: BudgetTableItem[] = monthlyBills
        .map((b) => ({
          id: `bill-${b.id}`,
          description: b.type,
          category: 'Rezsi',
          amount: getBillPortion(b),
          dueDate: b.dueDate,
          paidDate: b.paidDate,
          isBill: true,
        }))
        .filter((b) => b.amount > 0);
      filtered = [...filtered, ...billItems];
    }

    if (filtered.length > 0) {
      acc[cat] = filtered;
    }
    
    return acc;
  }, {} as Record<string, BudgetTableItem[]>);
}
