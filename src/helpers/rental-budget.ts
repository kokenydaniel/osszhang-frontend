import { yearMonthPrefix } from '@/utils/dates';
import type { CashTransaction } from '@/types';
import type { RentalIncomeEntry, RentalProperty } from '@/types/rental';

export const RENTAL_BUDGET_ID_PREFIX = 'rental-income-';

export function rentalIncomeId(propertyId: number, year: number, month: number): string {
  return `${RENTAL_BUDGET_ID_PREFIX}${propertyId}-${year}-${month}`;
}

export function parseRentalIncomeId(
  id: string | number,
): { propertyId: number; year: number; month: number } | null {
  if (typeof id !== 'string' || !id.startsWith(RENTAL_BUDGET_ID_PREFIX)) return null;
  const rest = id.slice(RENTAL_BUDGET_ID_PREFIX.length);
  const match = rest.match(/^(\d+)-(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  return { propertyId: Number(match[1]), year: Number(match[2]), month: Number(match[3]) };
}

export function isRentalIncomeTransaction(tx: Pick<CashTransaction, 'id'>): boolean {
  return typeof tx.id === 'string' && tx.id.startsWith(RENTAL_BUDGET_ID_PREFIX);
}

function matchIncomeCategory(categories: string[], pattern: string): string {
  const p = pattern.trim().toLowerCase();
  const hit = categories.find((c) => c.toLowerCase().includes(p));
  return hit ?? categories[0] ?? 'Bevétel';
}

function dueDateForProperty(property: RentalProperty, year: number, month: number): string {
  const day = Math.min(Math.max(property.dueDay ?? 5, 1), 28);
  return `${yearMonthPrefix(year, month)}-${String(day).padStart(2, '0')}`;
}

export function buildRentalBudgetIncomes(
  properties: RentalProperty[],
  incomeEntries: RentalIncomeEntry[],
  year: number,
  month: number,
  categories: string[],
  categoryPattern: string,
): CashTransaction[] {
  const category = matchIncomeCategory(categories, categoryPattern);
  const entriesByProperty = new Map(
    incomeEntries
      .filter((e) => e.periodYear === year && e.periodMonth === month)
      .map((e) => [e.rentalPropertyId, e]),
  );

  return properties
    .filter((p) => p.isActive && p.budgetSyncEnabled)
    .map((property) => {
      const entry = entriesByProperty.get(property.id);
      const amount = entry?.amount ?? property.monthlyRent + property.monthlyCommonCost;
      const dueDate = entry?.dueDate ?? dueDateForProperty(property, year, month);
      const paidDate = entry?.paidDate ?? null;
      const tenant = property.tenantName ? ` — ${property.tenantName}` : '';

      return {
        id: rentalIncomeId(property.id, year, month),
        walletId: null,
        type: 'income' as const,
        description: `${property.name}${tenant} · bérleti díj`,
        category,
        amount,
        currency: entry?.currency ?? property.currency,
        dueDate,
        paidDate,
        isBudget: false,
        isReserve: false,
      };
    });
}

export function withRentalIncomePaid(
  entry: RentalIncomeEntry,
  paidDate: string,
): RentalIncomeEntry {
  return { ...entry, paidDate };
}

export function withRentalIncomeUnpaid(entry: RentalIncomeEntry): RentalIncomeEntry {
  return { ...entry, paidDate: null };
}
