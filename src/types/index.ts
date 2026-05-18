/**
 * PénzPilot Central Types Definition
 * Clean, structured, and fully typed domain and API models.
 */

// ==============================
// AUTHENTICATION & USER PROFILE
// ==============================

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'member';
  permissions?: string[];
  household?: {
    id: number;
    name: string;
    invite_code: string;
    users?: UserProfile[];
    categories?: string[];
  };
}

export interface RawApiUser {
  id: number;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  household?: {
    id: number;
    name: string;
    invite_code: string;
    users?: RawApiUser[];
    categories?: string[];
  };
}

// ==============================
// BUDGET MODULE
// ==============================

export interface LedgerEntry {
  id: number;
  date: string;
  amount: number;
  reason: string;
}

export interface CashTransaction {
  id: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  isBudget?: boolean;
  isReserve?: boolean;
  subItems?: LedgerEntry[];
}

export interface SavingsAccount {
  id: number;
  institution: string;
  currency: string;
  owner: string;
  count_in_savings: boolean;
  ledger: LedgerEntry[];
}

// ==============================
// UTILITIES MODULE
// ==============================

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

// ==============================
// METERS MODULE
// ==============================

export interface MeterReading {
  id: number;
  date: string;
  month: number;
  year: number;
  value: number;
  isReset: boolean;
  is_reset?: boolean;
  consumption: number;
  isEstimated?: boolean;
  is_estimated?: boolean;
  isOfficial?: boolean;
  is_official?: boolean;
}

export interface Meter {
  id: number;
  name: string;
  icon: string;
  unit: string;
  location: string;
  readings: MeterReading[];
}

// ==============================
// BUSINESS (LITTLE LOOM) MODULE
// ==============================

export interface BusinessOrder {
  id: number;
  date: string;
  customerName: string;
  channel: string;
  paymentMethod: string;
  provider: string;
  destination: string;
  amount: number;
  paidDate: string | null;
  hasInvoice?: boolean;
  invoiceId?: string;
  shopifyOrderId?: string;
  shopifyOrderNumber?: string;
  state: 'RENDBEN' | 'KINT' | 'KINT_PARKOL';
}

// ==============================
// DEBTS MODULE
// ==============================

export interface Debt {
  id: number;
  name: string;
  targetAmount: number;
  paidAmount: number;
  annualInterestRate?: number | null;
  minimumPayment?: number | null;
  dueDay?: number | null;
  status: 'Még fizetendő' | 'Van még' | 'Maradt' | 'Lejárt';
}

// ==============================
// AI INTEGRATION
// ==============================

export interface AiMeta {
  mode: string;
  provider: string;
  fallback_used: boolean;
  failure_reason?: string | null;
  generated_at: string;
}

export interface AiOverspendAnalysis {
  status: 'ok' | 'overspent';
  overspend_amount: number;
  top_drivers: Array<{ category: string; amount: number }>;
}

export interface AiCashflowForecast {
  projected_balance: number;
  monthly_projections: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export interface AiSavingsPlan {
  monthly_allocation_plan: Array<{
    goal: string;
    monthly_allocation: number;
  }>;
}

export interface AiUtilityAnomalies {
  anomalies: Array<{
    meter_id: number;
    meter_name: string;
    actual: number;
    expected: number;
    reason: string;
  }>;
}

export interface AiWeeklyBriefing {
  briefing_text: string;
  alerts?: string[];
}

export interface AiDebtPlan {
  strategy: 'avalanche' | 'snowball';
  recommended_payments: Array<{
    debt_id: number;
    debt_name: string;
    payment_amount: number;
  }>;
}

// ==============================
// GLOBAL STATE & SYSTEM
// ==============================

export type PaymentStatus = 'Várható' | 'Teljesítve' | 'Késik';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type Currency = 'HUF' | 'EUR' | 'USD' | 'BTC' | 'ETH' | 'HRK';
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const MONTH_NAMES: Record<number, string> = {
  1: 'Január', 2: 'Február', 3: 'Március', 4: 'Április',
  5: 'Május', 6: 'Június', 7: 'Július', 8: 'Augusztus',
  9: 'Szeptember', 10: 'Október', 11: 'November', 12: 'December',
};
