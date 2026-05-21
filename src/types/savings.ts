import type { LedgerEntry } from './budget';

export interface SavingsAccount {
  id: number;
  institution: string;
  currency: string;
  owner: string;
  count_in_savings: boolean;
  ledger: LedgerEntry[];
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
