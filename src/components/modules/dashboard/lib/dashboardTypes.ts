import type { Investment } from '@/types';

export type DashboardUnpaidItem = {
  id: number;
  type: 'expense' | 'bill';
  description: string;
  amount: number;
  dueDate: string;
  category: string;
};

export type DashboardConsumptionItem = {
  id: number;
  name: string;
  location: string;
  value: number;
  unit: string;
};

export type DashboardInvestmentPayout = {
  invName: string;
  owner: string;
  amount: number;
  date: string | null;
  isEstimated: boolean;
  label: string;
};

export type DashboardChartPoint = {
  name: string;
  amount: number;
};

export type DashboardModuleAccess = (mod: string) => boolean;

export type DashboardCashflowMetrics = import('@/services/BudgetService').BudgetCashflowMetrics & {
  lockedSavings: number;
};

export type DashboardSnapshotInput = {
  user: import('@/types').UserProfile | null;
  canUse: DashboardModuleAccess;
  businessEnabled: boolean;
  utilitySplitEnabled: boolean;
  counterpartyLabel: string;
  businessName: string;
  cashflow: DashboardCashflowMetrics;
  transactions: import('@/types').CashTransaction[];
  bills: import('@/types').UtilityBill[];
  settlements: import('@/types').UtilitySettlement[];
  savings: import('@/types').SavingsAccount[];
  investments: Investment[];
  meters: import('@/types').Meter[];
  orders: import('@/types/business').BusinessOrder[];
  debts: import('@/types').Debt[];
  selectedMonth: number;
  selectedYear: number;
  exchangeRates: Record<string, number>;
  onHouseholdSide: boolean;
  partnerId: number | null | undefined;
  todayStr: string;
};
