export type UtilitySplitRule = 'shared' | 'dani-private' | 'ildi-private';

export interface UtilityBill {
  id: number;
  type: string;
  total: number;
  dueDate: string;
  paidDate: string | null;
  paidBy: 'Mi' | 'Ildi' | null;
  splitRule: UtilitySplitRule;
}

export type UtilitySettlementDirection = 'partner_pays_household' | 'household_pays_partner';

export interface UtilitySettlement {
  id: number;
  year: number;
  month: number;
  amount: number;
  direction: UtilitySettlementDirection;
  settledAt: string;
  transactionId: number | null;
  partnerName: string;
  summary: string;
}

export interface UtilitiesIndexResponse {
  bills: UtilityBill[];
  settlements: UtilitySettlement[];
}
