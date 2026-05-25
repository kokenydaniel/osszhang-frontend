import type { SavingsAccount, SavingsType, SavingsWalletRef } from '@/types/savings';

type RawSavingsAccount = {
  id: number;
  type?: SavingsType;
  walletId?: number | null;
  wallet_id?: number | null;
  institution: string;
  currency?: string;
  owner?: string;
  count_in_savings?: boolean;
  goalAmount?: number;
  goal_amount?: number;
  currentAmount?: number;
  current_amount?: number;
  targetDate?: string | null;
  target_date?: string | null;
  wallet?: (SavingsWalletRef & { is_shared?: boolean }) | null;
  ledger?: SavingsAccount['ledger'];
};

export function mapSavingsAccountFromApi(raw: RawSavingsAccount): SavingsAccount {
  const wallet = raw.wallet
    ? {
        id: raw.wallet.id,
        name: raw.wallet.name,
        isShared: raw.wallet.isShared ?? raw.wallet.is_shared ?? true,
      }
    : null;

  const type: SavingsType = raw.type === 'goal' ? 'goal' : 'account';
  const ledger = raw.ledger ?? [];
  const goalAmount = raw.goalAmount ?? raw.goal_amount ?? 0;
  let currentAmount = raw.currentAmount ?? raw.current_amount ?? 0;
  if (type === 'goal') {
    currentAmount =
      ledger.length === 0
        ? 0
        : ledger.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  }

  return {
    id: raw.id,
    type,
    walletId: raw.walletId ?? raw.wallet_id ?? null,
    institution: raw.institution,
    currency: raw.currency ?? 'HUF',
    owner: raw.owner ?? 'Közös',
    count_in_savings: raw.count_in_savings ?? true,
    goalAmount,
    currentAmount,
    targetDate: raw.targetDate ?? raw.target_date ?? null,
    wallet,
    ledger,
  };
}

export function mapSavingsAccountsFromApi(rows: RawSavingsAccount[]): SavingsAccount[] {
  return rows.map(mapSavingsAccountFromApi);
}

export function savingsBalance(item: SavingsAccount): number {
  if (item.type === 'goal') {
    if (item.ledger.length === 0) return 0;
    return item.ledger.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  }
  return item.ledger.reduce((sum, entry) => sum + entry.amount, 0);
}

export function savingsAccountToApiPayload(
  data: Partial<Omit<SavingsAccount, 'id' | 'ledger'>> & {
    goal_amount?: number;
    current_amount?: number;
    target_date?: string | null;
  },
): Record<string, unknown> {
  return {
    ...(data.type !== undefined ? { type: data.type } : {}),
    ...(data.institution !== undefined ? { institution: data.institution } : {}),
    ...(data.currency !== undefined ? { currency: data.currency } : {}),
    ...(data.owner !== undefined ? { owner: data.owner } : {}),
    ...(data.count_in_savings !== undefined ? { count_in_savings: data.count_in_savings } : {}),
    ...(data.goalAmount !== undefined ? { goal_amount: data.goalAmount } : {}),
    ...(data.goal_amount !== undefined ? { goal_amount: data.goal_amount } : {}),
    ...(data.currentAmount !== undefined ? { current_amount: data.currentAmount } : {}),
    ...(data.current_amount !== undefined ? { current_amount: data.current_amount } : {}),
    ...(data.targetDate !== undefined ? { target_date: data.targetDate } : {}),
    ...(data.target_date !== undefined ? { target_date: data.target_date } : {}),
    ...(data.walletId !== undefined ? { walletId: data.walletId } : {}),
  };
}
