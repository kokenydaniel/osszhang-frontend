import { aiFinanceClient } from '@/lib/api-client';
import { unwrapApiData } from '@/lib/unwrapApiData';
import { getApiErrorMessage } from '@/lib/api-client';
import type { AiTravelPlan } from '@/types';

export interface TravelPlanPayload {
  destination: string;
  durationDays: number;
  totalBudget: number;
}

class TravelServiceImpl {
  async planTrip(payload: TravelPlanPayload): Promise<AiTravelPlan> {
    const res = await aiFinanceClient.planTravel({
      destination: payload.destination.trim(),
      duration_days: payload.durationDays,
      total_budget: payload.totalBudget,
    });
    return unwrapApiData<AiTravelPlan>(res.data);
  }

  getErrorMessage(error: unknown, fallback: string): string {
    return getApiErrorMessage(error, fallback);
  }
}

export const TravelService = new TravelServiceImpl();
