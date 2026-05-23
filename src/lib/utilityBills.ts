import type { UtilityBill } from '@/types';
import { isPastDueDate, matchesMonthYear, hasSettlementDate, isDueOverdue } from '@/lib/dates';

export function isLegacySettlementBill(bill: UtilityBill): boolean {
  return /kiegyenlít/i.test(bill.type);
}

export function filterUtilityBillsForDisplay(bills: UtilityBill[]): UtilityBill[] {
  return bills.filter((b) => !isLegacySettlementBill(b));
}

export function isUtilityBillUnsettled(
  bill: Pick<UtilityBill, 'paidDate' | 'paidBy'>,
  splitEnabled: boolean,
): boolean {
  if (splitEnabled) return !bill.paidBy;
  return !hasSettlementDate(bill.paidDate);
}

export function isUtilityBillOverdue(
  bill: Pick<UtilityBill, 'dueDate' | 'paidDate' | 'paidBy'>,
  options: { splitEnabled: boolean; today?: string },
): boolean {
  if (!isUtilityBillUnsettled(bill, options.splitEnabled)) return false;
  return isPastDueDate(bill.dueDate, options.today);
}

export function billMatchesMonthYear(dueDate: string, month: number, year: number): boolean {
  return matchesMonthYear(dueDate, month, year);
}
