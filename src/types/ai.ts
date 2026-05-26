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
