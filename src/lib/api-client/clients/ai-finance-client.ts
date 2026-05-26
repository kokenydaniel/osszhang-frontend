import type { ApiClient } from '../api-client';
import type {
  AiCashflowForecast,
  AiCfoBrief,
  AiCfoContextPayload,
  AiDebtPlan,
  AiEnvelope,
  AiOverspendAnalysis,
  AiSavingsPlan,
  AiTravelPlan,
  AiUtilityAnomalies,
  AiWeeklyBriefing,
} from '@/types';

import type { RequestOptions } from '@/lib/api-client/response';

const AI_REQUEST_TIMEOUT_MS = 120_000;

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

  getOverspendRootCause(year: number, month: number, walletId?: number | null, options?: RequestOptions) {
    return this.apiClient.getJson<AiEnvelope<AiOverspendAnalysis>>(
      `${this.baseEndpoint}/v1/budget/overspend-root-cause`,
      {
        ...options,
        timeoutMs: options?.timeoutMs ?? AI_REQUEST_TIMEOUT_MS,
        params: {
          year,
          month,
          ...(walletId != null ? { wallet_id: walletId } : {}),
        },
      },
    );
  }

  getCashflowForecast(year: number, month: number, walletId?: number | null, options?: RequestOptions) {
    return this.apiClient.getJson<AiEnvelope<AiCashflowForecast>>(
      `${this.baseEndpoint}/v1/budget/cashflow-forecast`,
      {
        ...options,
        timeoutMs: options?.timeoutMs ?? AI_REQUEST_TIMEOUT_MS,
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

  getAiCfo(payload: AiCfoContextPayload, options?: RequestOptions) {
    return this.apiClient.postJson<AiEnvelope<AiCfoBrief>>('dashboard/ai-cfo', payload, {
      ...options,
      timeoutMs: options?.timeoutMs ?? AI_REQUEST_TIMEOUT_MS,
    });
  }

  planTravel(data: { destination: string; duration_days: number; total_budget: number }, options?: RequestOptions) {
    return this.apiClient.postJson<AiEnvelope<AiTravelPlan>>('tools/travel/plan', data, {
      ...options,
      timeoutMs: options?.timeoutMs ?? AI_REQUEST_TIMEOUT_MS,
    });
  }
}
