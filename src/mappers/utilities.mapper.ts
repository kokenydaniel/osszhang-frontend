import type { UtilityBill, UtilitySettlement, UtilitySplitRule } from '@/types';

export type RawUtilityBill = {
  id: number;
  type: string;
  total?: number;
  dueDate?: string;
  due_date?: string;
  paidDate?: string | null;
  paid_date?: string | null;
  paidBy?: 'Mi' | 'Ildi' | null;
  paid_by?: 'Mi' | 'Ildi' | null;
  splitRule?: UtilitySplitRule;
  split_rule?: UtilitySplitRule;
};

export type RawUtilitySettlement = {
  id: number;
  year: number;
  month: number;
  amount?: number;
  direction?: UtilitySettlement['direction'];
  settledAt?: string;
  settled_at?: string;
  transactionId?: number | null;
  transaction_id?: number | null;
  partnerName?: string;
  partner_name?: string;
  summary?: string;
};

export type CreateUtilityBillPayload = Omit<UtilityBill, 'id'>;
export type UpdateUtilityBillPayload = Partial<Omit<UtilityBill, 'id'>>;

export type UtilitiesIndex = {
  bills: UtilityBill[];
  settlements: UtilitySettlement[];
};

export function mapUtilityBillFromApi(raw: RawUtilityBill): UtilityBill {
  return {
    id: raw.id,
    type: raw.type,
    total: Number(raw.total ?? 0),
    dueDate: raw.dueDate ?? raw.due_date ?? '',
    paidDate: raw.paidDate ?? raw.paid_date ?? null,
    paidBy: raw.paidBy ?? raw.paid_by ?? null,
    splitRule: raw.splitRule ?? raw.split_rule ?? 'shared',
  };
}

export function mapUtilitySettlementFromApi(raw: RawUtilitySettlement): UtilitySettlement {
  return {
    id: raw.id,
    year: raw.year,
    month: raw.month,
    amount: Number(raw.amount ?? 0),
    direction: raw.direction ?? 'partner_pays_household',
    settledAt: raw.settledAt ?? raw.settled_at ?? '',
    transactionId: raw.transactionId ?? raw.transaction_id ?? null,
    partnerName: raw.partnerName ?? raw.partner_name ?? '',
    summary: raw.summary ?? '',
  };
}

export function mapUtilitiesIndexFromApi(data: unknown): UtilitiesIndex {
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
    return mapUtilitiesIndexFromApi(record.data);
  }

  const bills = record.bills;
  const settlements = record.settlements;

  return {
    bills: Array.isArray(bills) ? (bills as RawUtilityBill[]).map(mapUtilityBillFromApi) : [],
    settlements: Array.isArray(settlements)
      ? (settlements as RawUtilitySettlement[]).map(mapUtilitySettlementFromApi)
      : [],
  };
}

export function utilityBillToApiPayload(payload: CreateUtilityBillPayload | UpdateUtilityBillPayload): Record<string, unknown> {
  return { ...payload };
}

export function settleMonthToApiPayload(params: { month: number; year: number }): Record<string, unknown> {
  return { month: params.month, year: params.year };
}
