export type SavingsType = 'account' | 'goal';

export interface SavingsWalletRef {
  id: number;
  name: string;
  isShared: boolean;
}

export interface SavingsAccount {
  id: number;
  type: SavingsType;
  walletId?: number | null;
  institution: string;
  currency: string;
  owner: string;
  count_in_savings: boolean;
  goalAmount: number;
  currentAmount: number;
  targetDate: string | null;
  wallet?: SavingsWalletRef | null;
  ledger: import('./budget').LedgerEntry[];
}

export interface Investment {
  id: number;
  name: string;
  type: string;
  principalAmount: number;
  annualInterestRate: number;
  purchaseDate: string;
  maturityDate: string | null;
  owner: string;
  countInSavings: boolean;
  currentValue?: number | null;
  maturityAmount?: number | null;
  nextPayoutAmount?: number | null;
  nextPayoutDate?: string | null;
}
