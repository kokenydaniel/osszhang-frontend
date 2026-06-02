import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, isSingleEntityApiResponse } from '../response';
import type { RequestOptions } from '../response';
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

const AI_REQUEST_TIMEOUT_MS = 120_000;

export class AiFinanceClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'ai') {}

  async query(prompt: string, includeContext = true, walletId?: number | null): SingleEntityResponse<{ answer: string }> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/query`, {
        prompt,
        include_context: includeContext,
        ...(walletId != null ? { wallet_id: walletId } : {}),
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ answer: string }>(response, ['answer'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async autoCategorizeTransaction(data: {
    description: string;
    type?: 'income' | 'expense';
    amount?: number;
    candidate_categories: string[];
  }): SingleEntityResponse<AiEnvelope<{ category?: string }>> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/v1/transactions/auto-categorize`,
        data,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<{ category?: string }>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getOverspendRootCause(year: number, month: number, walletId?: number | null, options?: RequestOptions): SingleEntityResponse<AiEnvelope<AiOverspendAnalysis>> {
    try {
      const [status, response] = await this.apiClient.getJson(
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
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiOverspendAnalysis>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getCashflowForecast(year: number, month: number, walletId?: number | null, options?: RequestOptions): SingleEntityResponse<AiEnvelope<AiCashflowForecast>> {
    try {
      const [status, response] = await this.apiClient.getJson(
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
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiCashflowForecast>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getUtilitiesAnomalies(year: number, month: number): SingleEntityResponse<AiEnvelope<AiUtilityAnomalies>> {
    try {
      const [status, response] = await this.apiClient.getJson(
        `${this.baseEndpoint}/v1/utilities/anomalies`,
        { params: { year, month } },
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiUtilityAnomalies>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getWeeklyBriefing(weekStart?: string, walletId?: number | null): SingleEntityResponse<AiEnvelope<AiWeeklyBriefing>> {
    try {
      const [status, response] = await this.apiClient.getJson(
        `${this.baseEndpoint}/v1/dashboard/weekly-briefing`,
        {
          params: {
            ...(weekStart ? { week_start: weekStart } : {}),
            ...(walletId != null ? { wallet_id: walletId } : {}),
          },
        },
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiWeeklyBriefing>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getSavingsRecommendations(data: {
    goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
    constraints?: { min_buffer?: number };
    wallet_id?: number | null;
  }): SingleEntityResponse<AiEnvelope<AiSavingsPlan>> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/v1/savings/recommendations`,
        data,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiSavingsPlan>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async optimizeDebts(data: { strategy?: 'avalanche' | 'snowball'; wallet_id?: number | null }): SingleEntityResponse<AiEnvelope<AiDebtPlan>> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/v1/debts/optimize`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiDebtPlan>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getAiCfo(payload: AiCfoContextPayload, options?: RequestOptions): SingleEntityResponse<AiEnvelope<AiCfoBrief>> {
    try {
      const [status, response] = await this.apiClient.postJson('dashboard/ai-cfo', payload, {
        ...options,
        timeoutMs: options?.timeoutMs ?? AI_REQUEST_TIMEOUT_MS,
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiCfoBrief>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async planTravel(data: { destination: string; duration_days: number; total_budget: number }, options?: RequestOptions): SingleEntityResponse<AiEnvelope<AiTravelPlan>> {
    try {
      const [status, response] = await this.apiClient.postJson('tools/travel/plan', data, {
        ...options,
        timeoutMs: options?.timeoutMs ?? AI_REQUEST_TIMEOUT_MS,
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiTravelPlan>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
