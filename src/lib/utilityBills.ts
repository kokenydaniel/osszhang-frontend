import type { UtilityBill } from '@/types';

/** Régi „X kiegyenlítés” rezsi-sorok — nem jelennek meg a listában. */
export function isLegacySettlementBill(bill: UtilityBill): boolean {
  return /kiegyenlít/i.test(bill.type);
}

export function filterUtilityBillsForDisplay(bills: UtilityBill[]): UtilityBill[] {
  return bills.filter((b) => !isLegacySettlementBill(b));
}
