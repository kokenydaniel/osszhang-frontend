import type { UtilityBill, UtilitySettlement } from '@/types';

/** GET /utilities és klón/elszámolás válasz — több lehetséges formátum. */
export function parseUtilitiesIndexResponse(data: unknown): {
  bills: UtilityBill[];
  settlements: UtilitySettlement[];
} {
  if (data == null) {
    return { bills: [], settlements: [] };
  }

  if (Array.isArray(data)) {
    return { bills: data as UtilityBill[], settlements: [] };
  }

  if (typeof data !== 'object') {
    return { bills: [], settlements: [] };
  }

  const record = data as Record<string, unknown>;

  if (record.data != null && typeof record.data === 'object') {
    return parseUtilitiesIndexResponse(record.data);
  }

  const bills = record.bills;
  const settlements = record.settlements;

  return {
    bills: Array.isArray(bills) ? (bills as UtilityBill[]) : [],
    settlements: Array.isArray(settlements) ? (settlements as UtilitySettlement[]) : [],
  };
}
