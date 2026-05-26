import type { Debt } from '@/types/debts';

export type RawDebt = {
  id: number;
  walletId?: number | null;
  wallet_id?: number | null;
  name: string;
  targetAmount?: number;
  target_amount?: number;
  paidAmount?: number;
  paid_amount?: number;
  annualInterestRate?: number | null;
  annual_interest_rate?: number | null;
  minimumPayment?: number | null;
  minimum_payment?: number | null;
  dueDay?: number | null;
  due_day?: number | null;
  status?: Debt['status'];
};

export type CreateDebtPayload = Omit<Debt, 'id'>;
export type UpdateDebtPayload = Partial<Omit<Debt, 'id'>>;

export function mapDebtFromApi(raw: RawDebt): Debt {
  return {
    id: raw.id,
    walletId: raw.walletId ?? raw.wallet_id ?? null,
    name: raw.name,
    targetAmount: Number(raw.targetAmount ?? raw.target_amount ?? 0),
    paidAmount: Number(raw.paidAmount ?? raw.paid_amount ?? 0),
    annualInterestRate: raw.annualInterestRate ?? raw.annual_interest_rate ?? null,
    minimumPayment: raw.minimumPayment ?? raw.minimum_payment ?? null,
    dueDay: raw.dueDay ?? raw.due_day ?? null,
    status: raw.status ?? 'Van még',
  };
}

export function mapDebtsFromApi(rows: RawDebt[]): Debt[] {
  return rows.map(mapDebtFromApi);
}

export function debtToApiPayload(payload: CreateDebtPayload | UpdateDebtPayload): Record<string, unknown> {
  const out: Record<string, unknown> = { ...payload };
  if ('walletId' in out) {
    out.walletId = out.walletId ?? undefined;
  }
  return out;
}
