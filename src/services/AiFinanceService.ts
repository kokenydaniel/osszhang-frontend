import { aiFinanceClient } from '@/lib/api-client';
import { unwrapApiData } from '@/lib/unwrapApiData';
import type { AiOverspendAnalysis, AiCashflowForecast, AiWeeklyBriefing, AiDebtPlan } from '@/types';

class AiFinanceServiceImpl {
  async getOverspendRootCause(year: number, month: number, walletId: number | null): Promise<AiOverspendAnalysis | null> {
    if (walletId === null) return null;
    const res = await aiFinanceClient.getOverspendRootCause(year, month, walletId);
    return unwrapApiData<AiOverspendAnalysis>(res.data);
  }

  async getCashflowForecast(year: number, month: number, walletId: number | null): Promise<AiCashflowForecast | null> {
    if (walletId === null) return null;
    const res = await aiFinanceClient.getCashflowForecast(year, month, walletId);
    return unwrapApiData<AiCashflowForecast>(res.data);
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
}

export const AiFinanceService = new AiFinanceServiceImpl();
