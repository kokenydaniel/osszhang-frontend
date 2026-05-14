// TypeScript type definitions for PénzPilot

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
}

// ==============================
// BUDGET MODULE
// ==============================
export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category_id: number;
  category?: Category;
  amount: number;
  currency: string;
  description: string;
  date: string;
  month: number;
  year: number;
  is_recurring: boolean;
  recurring_day?: number;
  user_id: number;
  user?: User;
}

export interface SalaryPayment {
  id: number;
  name: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  is_paid: boolean;
  month: number;
  year: number;
  notes?: string;
}

export interface SavingsAccount {
  id: number;
  name: string;
  platform: string;
  currency: string;
  icon?: string;
  sort_order: number;
  latestSnapshot?: SavingsSnapshot;
}

export interface SavingsSnapshot {
  id: number;
  savings_account_id: number;
  balance: number;
  exchange_rate?: number;
  huf_value: number;
  month: number;
  year: number;
  date: string;
}

export interface Pikkolo {
  id: number;
  month: number;
  year: number;
  budget_amount: number;
  spent_amount: number;
}

export interface PlannedExpense {
  id: number;
  name: string;
  amount: number;
  is_paid: boolean;
  paid_date?: string;
  priority: number;
  notes?: string;
  month?: number;
  year?: number;
}

export interface BudgetSummary {
  year: number;
  total_income: number;
  total_expense: number;
  total_savings: number;
  total_pikkolo: number;
  balance: number;
  months: MonthSummary[];
  categories: CategorySummary[];
}

export interface MonthSummary {
  month: number;
  year: number;
  income: number;
  expense: number;
  savings: number;
}

export interface CategorySummary {
  category: Category;
  total: number;
  monthly_avg: number;
}

// ==============================
// LITTLE LOOM MODULE
// ==============================
export type PaymentMethod = 'kartya' | 'utalas' | 'utanvet' | 'keszpenz';
export type OrderChannel = 'webshop' | 'privat_rendeles' | 'foxpost';
export type OutstandingStatus = 'rendben' | 'kint' | 'szolgaltatonal';

export interface LLOrder {
  id: number;
  date: string;
  month: number;
  year: number;
  customer_name: string;
  channel: OrderChannel;
  payment_method: PaymentMethod;
  provider: string;
  destination: string;
  payout_date?: string;
  amount: number;
  has_invoice: boolean;
  invoice_number?: string;
  outstanding_status: OutstandingStatus;
  notes?: string;
}

export interface LLExpense {
  id: number;
  date: string;
  month: number;
  year: number;
  category: string;
  description: string;
  amount: number;
}

export interface BusinessSummary {
  year: number;
  total_revenue: number;
  months: BusinessMonthSummary[];
  by_payment_method: Record<PaymentMethod, number>;
  on_barion: number;
  on_shopify: number;
}

export interface BusinessMonthSummary {
  month: number;
  year: number;
  total: number;
  by_method: Record<PaymentMethod, number>;
}

// ==============================
// UTILITY MODULE
// ==============================
export interface UtilityType {
  id: number;
  name: string;
  icon: string;
  color: string;
  location: string;
  split_ratio: number;
  sort_order: number;
}

export interface UtilityBill {
  id: number;
  utility_type_id: number;
  utility_type?: UtilityType;
  total_amount: number;
  paid_by: 'mi' | 'ildi';
  per_person_amount: number;
  payment_date: string;
  month: number;
  year: number;
  notes?: string;
}

export interface UtilitySettlement {
  id: number;
  month: number;
  year: number;
  ildi_total: number;
  dani_total: number;
  balance: number;
  is_settled: boolean;
  settled_date?: string;
  settled_amount?: number;
  notes?: string;
}

// ==============================
// METERS MODULE
// ==============================
export interface Meter {
  id: number;
  name: string;
  type: 'electricity' | 'water' | 'gas';
  unit: string;
  location: string;
  meter_number?: string;
}

export interface MeterReading {
  id: number;
  meter_id: number;
  meter?: Meter;
  reading_value: number;
  date: string;
  month: number;
  year: number;
  notes?: string;
  consumption?: number;
}

// ==============================
// DASHBOARD
// ==============================
export interface DashboardData {
  period: { month: number; year: number };
  income: number;
  expense: number;
  savings_total: number;
  pending_payments: SalaryPayment[];
  overdue_payments: SalaryPayment[];
  little_loom_revenue: number;
  utility_balance: number;
  utility_balance_direction: 'ildi_owes' | 'we_owe';
  monthly_chart: MonthSummary[];
  latest_transactions: Transaction[];
}

// ==============================
// API RESPONSE
// ==============================
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// ==============================
// MISC
// ==============================
export type Currency = 'HUF' | 'EUR' | 'USD' | 'BTC' | 'ETH' | 'HRK';
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const MONTH_NAMES: Record<number, string> = {
  1: 'Január', 2: 'Február', 3: 'Március', 4: 'Április',
  5: 'Május', 6: 'Június', 7: 'Július', 8: 'Augusztus',
  9: 'Szeptember', 10: 'Október', 11: 'November', 12: 'December',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  kartya: 'Kártya',
  utalas: 'Utalás',
  utanvet: 'Utánvét',
  keszpenz: 'Készpénz',
};

export const CHANNEL_LABELS: Record<OrderChannel, string> = {
  webshop: 'Webshop',
  privat_rendeles: 'Privát rendelés',
  foxpost: 'Foxpost',
};
