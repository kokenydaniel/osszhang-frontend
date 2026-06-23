import { ApiClient } from '../api-client';
import type { RequestOptions, SingleEntityResponse } from '../response';
import { isSingleEntityApiResponse } from '../type-guards';
import { StatusCodes } from '@/types/api';
import type { AiEnvelope, AiTravelPlan } from '@/types/ai';
import type { SavedTravelPlanRecord, TravelPlanApiPayload, TravelPlanCostAdjustmentsPayload } from '@/types/travel';

const AI_REQUEST_TIMEOUT_MS = 120_000;

export class TravelClient {
  constructor(private readonly apiClient: ApiClient) {}

  async planTravel(
    data: TravelPlanApiPayload,
    options?: RequestOptions,
  ): SingleEntityResponse<AiEnvelope<AiTravelPlan>> {
    try {
      const [status, response] = await this.apiClient.postJson('tools/travel/plan', data, {
        ...options,
        timeoutMs: options?.timeoutMs ?? AI_REQUEST_TIMEOUT_MS,
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AiEnvelope<AiTravelPlan>>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('TravelClient.planTravel error', err);
      throw err;
    }
    return null;
  }

  async listPlans(walletId?: number | null, options?: RequestOptions) {
    const query = walletId != null ? `?walletId=${walletId}` : '';
    const [status, response] = await this.apiClient.getJson(`tools/travel/plans${query}`, options);
    if (status === StatusCodes.Http200 && Array.isArray(response)) {
      return response as SavedTravelPlanRecord[];
    }
    return [];
  }

  async getPlan(id: number, options?: RequestOptions): Promise<SavedTravelPlanRecord | null> {
    const [status, response] = await this.apiClient.getJson(`tools/travel/plans/${id}`, options);
    if (status === StatusCodes.Http200 && response && typeof response === 'object') {
      return response as SavedTravelPlanRecord;
    }
    return null;
  }

  async deletePlan(id: number, options?: RequestOptions): Promise<boolean> {
    const [status] = await this.apiClient.deleteJson(`tools/travel/plans/${id}`, options);
    return status === StatusCodes.Http200 || status === StatusCodes.Http204;
  }

  async linkSaving(planId: number, savingId: number, options?: RequestOptions): Promise<SavedTravelPlanRecord | null> {
    const [status, response] = await this.apiClient.postJson(
      `tools/travel/plans/${planId}/link-saving`,
      { saving_id: savingId },
      options,
    );
    if (status === StatusCodes.Http200 && response && typeof response === 'object') {
      return response as SavedTravelPlanRecord;
    }
    return null;
  }

  async updateCostAdjustments(
    planId: number,
    payload: TravelPlanCostAdjustmentsPayload,
    options?: RequestOptions,
  ): Promise<boolean> {
    const [status] = await this.apiClient.patchJson(`tools/travel/plans/${planId}`, payload, options);
    return status === StatusCodes.Http200;
  }
}
