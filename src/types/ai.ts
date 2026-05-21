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
