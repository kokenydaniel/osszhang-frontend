import { aiFinanceClient } from '@/lib/api-client';
import { isTimeoutError } from '@/lib/api-client/abortError';
import { unwrapApiData } from '@/lib/unwrapApiData';
import { MetersService } from '@/services/MetersService';
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

class AiFinanceServiceImpl {
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
      return unwrapApiData<AiOverspendAnalysis>(res.data);
    } catch (error) {
      if (!options?.silent || !isTimeoutError(error)) {
        console.error('[AiFinanceService] getOverspendRootCause failed', error);
      }
      return null;
    }
  }

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
      return unwrapApiData<AiCashflowForecast>(res.data);
    } catch (error) {
      if (!options?.silent || !isTimeoutError(error)) {
        console.error('[AiFinanceService] getCashflowForecast failed', error);
      }
      return null;
    }
  }

  async getWeeklyBriefing(weekStart: string | undefined, walletId: number | null): Promise<AiWeeklyBriefing | null> {
    if (walletId === null) return null;
    const res = await aiFinanceClient.getWeeklyBriefing(weekStart, walletId);
    return unwrapApiData<AiWeeklyBriefing>(res.data);
  }

  async autoCategorizeTransaction(params: {
    description: string;
    type: 'expense' | 'income';
    amount?: number;
    candidate_categories: string[];
  }): Promise<string | null> {
    const res = await aiFinanceClient.autoCategorizeTransaction(params);
    return res.data?.data?.category || null;
  }

  async getStrategyAdvice(prompt: string): Promise<string> {
    try {
      const res = await aiFinanceClient.query(prompt, false);
      return res.data?.answer ?? 'Sajnos nem sikerült elérni az AI szolgáltatást. Kérlek próbáld újra később.';
    } catch (error) {
      console.error('[AiFinanceService] getStrategyAdvice failed', error);
      return 'Sajnos nem sikerült elérni az AI szolgáltatást. Kérlek próbáld újra később.';
    }
  }

  async getDebtOptimizationPlan(
    strategy: 'avalanche' | 'snowball',
    walletId: number | null,
  ): Promise<AiDebtPlan | null> {
    try {
      const res = await aiFinanceClient.optimizeDebts({
        strategy,
        ...(walletId != null ? { wallet_id: walletId } : {}),
      });
      return unwrapApiData<AiDebtPlan>(res.data);
    } catch (error) {
      console.error('[AiFinanceService] getDebtOptimizationPlan failed', error);
      return null;
    }
  }

  async estimateMeterConsumption(prompt: string): Promise<number | null> {
    try {
      const res = await aiFinanceClient.query(prompt, false);
      return MetersService.parseAiConsumption(res.data?.answer ?? '');
    } catch (error) {
      console.error('[AiFinanceService] estimateMeterConsumption failed', error);
      return null;
    }
  }

  async getUtilityAnomalies(year: number, month: number): Promise<AiUtilityAnomalies | null> {
    try {
      const res = await aiFinanceClient.getUtilitiesAnomalies(year, month);
      return unwrapApiData<AiUtilityAnomalies>(res.data);
    } catch (error) {
      console.error('[AiFinanceService] getUtilityAnomalies failed', error);
      return null;
    }
  }

  async getAiCfo(
    payload: AiCfoContextPayload,
    options?: { silent?: boolean },
  ): Promise<AiCfoBrief | null> {
    try {
      const res = await aiFinanceClient.getAiCfo(payload, {
        silent: options?.silent,
      });
      return unwrapApiData<AiCfoBrief>(res.data);
    } catch (error) {
      console.error('[AiFinanceService] getAiCfo failed', error);
      return null;
    }
  }

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
      return unwrapApiData<AiTravelPlan>(res.data);
    } catch (error) {
      console.error('[AiFinanceService] planTravel failed', error);
      throw error;
    }
  }
}

export const AiFinanceService = new AiFinanceServiceImpl();
