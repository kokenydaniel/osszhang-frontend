export interface AiMeta {
  mode: string;
  provider: string;
  fallback_used: boolean;
  failure_reason?: string | null;
  generated_at: string;
}

export interface AiEnvelope<T> {
  data: T;
  meta: AiMeta;
}

export interface AiOverspendAnalysis {
  status: 'ok' | 'overspent';
  overspend_amount: number;
  monthly_balance?: number;
  income_received?: number;
  spent_this_month?: number;
  top_drivers: Array<{ category: string; amount: number }>;
  actions?: string[];
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
  schedule: Array<{
    rank: number;
    debt_id: number;
    name: string;
    remaining: number;
    recommended_extra_payment: number;
  }>;
  payoff_date?: string | null;
  total_interest?: number | null;
  alternatives?: Array<'avalanche' | 'snowball'>;
}

export interface AiCfoBrief {
  summary: string;
  tips: string[];
  warnings: string[];
}

export interface AiCfoGoalContext {
  title: string;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  target_date?: string | null;
}

export interface AiCfoDebtContext {
  name: string;
  remaining: number;
}

export interface AiCfoCategoryContext {
  category: string;
  amount: number;
}

export interface AiCfoContextPayload {
  year: number;
  month: number;
  wallet_id: number;
  total_balance: number;
  locked_savings: number;
  total_pending: number;
  disposable_remaining: number;
  overdue_total: number;
  income_received: number;
  spent_this_month: number;
  monthly_balance: number;
  total_debts: number;
  top_spending_categories: AiCfoCategoryContext[];
  savings_goals: AiCfoGoalContext[];
  debts: AiCfoDebtContext[];
}

export interface AiTravelDayPlan {
  day: number;
  title: string;
  activities: string[];
  estimated_daily_cost: number;
}

export interface AiTravelCostBreakdown {
  accommodation: number;
  food: number;
  activities: number;
  transport: number;
}

export interface AiTravelPlan {
  destination: string;
  duration_days: number;
  total_budget: number;
  daily_itinerary: AiTravelDayPlan[];
  cost_breakdown: AiTravelCostBreakdown;
  total_estimated_cost: number;
  summary?: string;
  warning?: string;
}

export interface AiPaymentPriorityItem {
  rank: number;
  source: string;
  id: number;
  label: string;
  amount: number;
  currency: string;
  due_date: string;
  is_overdue: boolean;
}

export interface AiPaymentPriority {
  year: number;
  month: number;
  total_amount: number;
  item_count: number;
  items: AiPaymentPriorityItem[];
  note?: string;
}

export interface AiVatEstimate {
  year: number;
  month: number;
  order_count: number;
  skipped_order_count?: number;
  net_total: number;
  vat_amount: number;
  gross_total: number;
  vat_percent?: number;
  price_input_mode?: 'net' | 'gross';
  tax_regime?: 'aam' | 'vat' | 'kata';
  income_tax_method?: 'cost_ratio' | 'actual' | 'kata_flat';
  cost_ratio_percent?: number;
  revenue_basis?: 'documented_only' | 'all_orders';
  estimated_taxable_income?: number | null;
  estimated_cost_share?: number | null;
  note?: string;
}

export interface AiCostReduction {
  suggestions: string[];
  categories?: Array<{ category: string; spent: number }>;
  note?: string;
}
