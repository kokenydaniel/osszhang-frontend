import type { ReceivableEntryType, ReceivableSource } from '@/config/receivables';

export type ReceivableEntry = {
  id: number;
  receivableContactId: number;
  entryType: ReceivableEntryType;
  amount: number;
  currency: string;
  source: ReceivableSource;
  entryDate: string;
  note: string | null;
  createdAt?: string | null;
};

export type ReceivableContact = {
  id: number;
  name: string;
  note: string | null;
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  isSettled: boolean;
  entries: ReceivableEntry[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ReceivablesSummary = {
  totalLent: number;
  totalRepaid: number;
  totalOutstanding: number;
  openContactCount: number;
  contactCount: number;
};

export type ReceivablesIndexResponse = {
  contacts: ReceivableContact[];
  summary: ReceivablesSummary;
};

export type CreateReceivableContactPayload = {
  name: string;
  note?: string | null;
};

export type CreateReceivableEntryPayload = {
  entryType: ReceivableEntryType;
  amount: number;
  source: ReceivableSource;
  entryDate: string;
  currency?: string;
  note?: string | null;
};
