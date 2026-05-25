import type { ApiClient } from '../api-client';
import type {
  AiCashflowForecast,
  AiDebtPlan,
  AiEnvelope,
  AiOverspendAnalysis,
  AiSavingsPlan,
  AiUtilityAnomalies,
  AiWeeklyBriefing,
} from '@/types';

export class AiFinanceClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'ai') {}

  query(prompt: string, includeContext = true, walletId?: number | null) {
    return this.apiClient.postJson<{ answer: string }>(`${this.baseEndpoint}/query`, {
      prompt,
      include_context: includeContext,
      ...(walletId != null ? { wallet_id: walletId } : {}),
    });
  }

  autoCategorizeTransaction(data: {
    description: string;
    type?: 'income' | 'expense';
    amount?: number;
    candidate_categories: string[];
  }) {
    return this.apiClient.postJson<AiEnvelope<{ category?: string }>>(
      `${this.baseEndpoint}/v1/transactions/auto-categorize`,
      data,
    );
  }

  getOverspendRootCause(year: number, month: number, walletId?: number | null) {
    return this.apiClient.getJson<AiEnvelope<AiOverspendAnalysis>>(
      `${this.baseEndpoint}/v1/budget/overspend-root-cause`,
      {
        params: {
          year,
          month,
          ...(walletId != null ? { wallet_id: walletId } : {}),
        },
      },
    );
  }

  getCashflowForecast(year: number, month: number, walletId?: number | null) {
    return this.apiClient.getJson<AiEnvelope<AiCashflowForecast>>(
      `${this.baseEndpoint}/v1/budget/cashflow-forecast`,
      {
        params: {
          year,
          month,
          ...(walletId != null ? { wallet_id: walletId } : {}),
        },
      },
    );
  }

  getUtilitiesAnomalies(year: number, month: number) {
    return this.apiClient.getJson<AiEnvelope<AiUtilityAnomalies>>(
      `${this.baseEndpoint}/v1/utilities/anomalies`,
      { params: { year, month } },
    );
  }

  getWeeklyBriefing(weekStart?: string, walletId?: number | null) {
    return this.apiClient.getJson<AiEnvelope<AiWeeklyBriefing>>(
      `${this.baseEndpoint}/v1/dashboard/weekly-briefing`,
      {
        params: {
          ...(weekStart ? { week_start: weekStart } : {}),
          ...(walletId != null ? { wallet_id: walletId } : {}),
        },
      },
    );
  }

  getSavingsRecommendations(data: {
    goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
    constraints?: { min_buffer?: number };
    wallet_id?: number | null;
  }) {
    return this.apiClient.postJson<AiEnvelope<AiSavingsPlan>>(
      `${this.baseEndpoint}/v1/savings/recommendations`,
      data,
    );
  }

  optimizeDebts(data: { strategy?: 'avalanche' | 'snowball'; wallet_id?: number | null }) {
    return this.apiClient.postJson<AiEnvelope<AiDebtPlan>>(`${this.baseEndpoint}/v1/debts/optimize`, data);
  }
}
