import { aiFinanceClient } from '@/lib/api-client';
import { isTimeoutError } from '@/lib/api-client/abortError';
import { getApiErrorMessage } from '@/helpers/api-error-message';
import { unwrapApiData } from '@/utils/unwrap-api-data';
import { isObject } from '@/lib/api-client/type-guards';
import { metersCalculations } from '@/calculations/meters';
import { StatusCodes } from '@/types/api';
import type {
  AiOverspendAnalysis,
  AiCashflowForecast,
  AiWeeklyBriefing,
  AiDebtPlan,
  AiUtilityAnomalies,
  AiCfoBrief,
  AiTravelPlan,
  AiCfoContextPayload,
} from '@/types';

function unwrapAiCfoBrief(payload: unknown): AiCfoBrief | null {
  const direct = unwrapApiData<AiCfoBrief>(payload);
  if (direct && typeof direct.summary === 'string' && direct.summary.trim()) {
    return direct;
  }

  if (isObject(payload) && isObject(payload.data)) {
    const nested = payload.data as Record<string, unknown>;
    if (typeof nested.summary === 'string' && nested.summary.trim()) {
      return {
        summary: nested.summary,
        tips: Array.isArray(nested.tips) ? (nested.tips as string[]) : [],
        warnings: Array.isArray(nested.warnings) ? (nested.warnings as string[]) : [],
      };
    }
  }

  return null;
}

export const aiHelpers = {
  async getOverspendRootCause(
    year: number,
    month: number,
    walletId: number | null,
    options?: { silent?: boolean },
  ): Promise<AiOverspendAnalysis | null> {
    if (walletId === null) return null;
    try {
      const res = await aiFinanceClient.getOverspendRootCause(year, month, walletId, {
        silent: options?.silent,
      });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      return unwrapApiData<AiOverspendAnalysis>(res[1]);
    } catch (error) {
      if (!options?.silent || !isTimeoutError(error)) {
        console.error('[aiHelpers] getOverspendRootCause failed', error);
      }
      return null;
    }
  },

  async getCashflowForecast(
    year: number,
    month: number,
    walletId: number | null,
    options?: { silent?: boolean },
  ): Promise<AiCashflowForecast | null> {
    if (walletId === null) return null;
    try {
      const res = await aiFinanceClient.getCashflowForecast(year, month, walletId, {
        silent: options?.silent,
      });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      return unwrapApiData<AiCashflowForecast>(res[1]);
    } catch (error) {
      if (!options?.silent || !isTimeoutError(error)) {
        console.error('[aiHelpers] getCashflowForecast failed', error);
      }
      return null;
    }
  },

  async getWeeklyBriefing(weekStart: string | undefined, walletId: number | null): Promise<AiWeeklyBriefing | null> {
    if (walletId === null) return null;
    const res = await aiFinanceClient.getWeeklyBriefing(weekStart, walletId);
    if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
    return unwrapApiData<AiWeeklyBriefing>(res[1]);
  },

  async autoCategorizeTransaction(params: {
    description: string;
    type: 'expense' | 'income';
    amount?: number;
    candidate_categories: string[];
  }): Promise<string | null> {
    const res = await aiFinanceClient.autoCategorizeTransaction(params);
    if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
    return res[1]?.data?.category || null;
  },

  async getStrategyAdvice(prompt: string): Promise<string> {
    try {
      const res = await aiFinanceClient.query(prompt, false);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      return res[1]?.answer ?? 'Sajnos nem sikerült elérni az AI szolgáltatást. Kérlek próbáld újra később.';
    } catch (error) {
      console.error('[aiHelpers] getStrategyAdvice failed', error);
      return 'Sajnos nem sikerült elérni az AI szolgáltatást. Kérlek próbáld újra később.';
    }
  },

  async getDebtOptimizationPlan(
    strategy: 'avalanche' | 'snowball',
    walletId: number | null,
  ): Promise<AiDebtPlan | null> {
    try {
      const res = await aiFinanceClient.optimizeDebts({
        strategy,
        ...(walletId != null ? { wallet_id: walletId } : {}),
      });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      return unwrapApiData<AiDebtPlan>(res[1]);
    } catch (error) {
      console.error('[aiHelpers] getDebtOptimizationPlan failed', error);
      return null;
    }
  },

  async estimateMeterConsumption(prompt: string): Promise<number | null> {
    try {
      const res = await aiFinanceClient.query(prompt, false);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      return metersCalculations.parseAiConsumption(res[1]?.answer ?? '');
    } catch (error) {
      console.error('[aiHelpers] estimateMeterConsumption failed', error);
      return null;
    }
  },

  async getUtilityAnomalies(year: number, month: number): Promise<AiUtilityAnomalies | null> {
    try {
      const res = await aiFinanceClient.getUtilitiesAnomalies(year, month);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      return unwrapApiData<AiUtilityAnomalies>(res[1]);
    } catch (error) {
      console.error('[aiHelpers] getUtilityAnomalies failed', error);
      return null;
    }
  },

  async getAiCfo(
    payload: AiCfoContextPayload,
    options?: { silent?: boolean },
  ): Promise<{ brief: AiCfoBrief | null; errorMessage: string | null }> {
    try {
      const res = await aiFinanceClient.getAiCfo(payload, {
        silent: options?.silent,
      });
      if (!res) {
        return { brief: null, errorMessage: null };
      }
      if (res[0] === StatusCodes.Http200) {
        const brief = unwrapAiCfoBrief(res[1]);
        if (brief) {
          return { brief, errorMessage: null };
        }
      }
      const message = getApiErrorMessage(
        res[0],
        res[1],
        'A havi pénzügyi tanácsadó jelenleg nem érhető el.',
      );
      if (!options?.silent) {
        console.warn('[aiHelpers] getAiCfo unavailable', res[0], message);
      }
      return { brief: null, errorMessage: null };
    } catch (error) {
      if (!options?.silent || !isTimeoutError(error)) {
        console.error('[aiHelpers] getAiCfo failed', error);
      }
      return { brief: null, errorMessage: null };
    }
  },

  async planTravel(
    payload: { destination: string; durationDays: number; totalBudget: number },
    options?: { silent?: boolean },
  ): Promise<AiTravelPlan | null> {
    try {
      const res = await aiFinanceClient.planTravel(
        {
          destination: payload.destination,
          duration_days: payload.durationDays,
          total_budget: payload.totalBudget,
        },
        { silent: options?.silent },
      );
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      return unwrapApiData<AiTravelPlan>(res[1]);
    } catch (error) {
      console.error('[aiHelpers] planTravel failed', error);
      throw error;
    }
  }
};
