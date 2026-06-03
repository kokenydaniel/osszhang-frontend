import type { ApiClient } from '../api-client';
import {
  StatusCodes,
  type CollectionResponse,
  type SingleEntityResponse,
  isSingleEntityApiResponse,
} from '../response';
import { unwrapApiEntity } from '../type-guards';
import { getApiErrorMessage } from '@/helpers/api-error-message';
import type { InsuranceIndexResponse, InsurancePolicy } from '@/types/insurance';
import type { RequestOptions } from '../response';

export type InsuranceApiFailure = {
  status: string;
  message: string;
};

let lastFailure: InsuranceApiFailure | null = null;

export function getLastInsuranceApiFailure(): InsuranceApiFailure | null {
  return lastFailure;
}

function parsePolicyEntity(response: object | null): InsurancePolicy | null {
  return (
    unwrapApiEntity<InsurancePolicy>(response, ['id']) ??
    (isSingleEntityApiResponse<InsurancePolicy>(response, ['id']) ? response : null)
  );
}

function recordFailure(status: string, response: object | null): null {
  lastFailure = {
    status,
    message: getApiErrorMessage(status, response),
  };
  if (process.env.NODE_ENV === 'development') {
    console.warn('[insurance]', lastFailure.message, { status, response });
  }
  return null;
}

export class InsuranceClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'insurance-policies') {}

  async getIndex(options?: RequestOptions): SingleEntityResponse<InsuranceIndexResponse> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, options);
      if (status === StatusCodes.Http200 && response && typeof response === 'object') {
        const body = response as InsuranceIndexResponse & { data?: InsuranceIndexResponse };
        const entity = Array.isArray(body.policies)
          ? body
          : body.data && Array.isArray(body.data.policies)
            ? body.data
            : null;
        if (entity) {
          const policies = entity.policies ?? [];
          return this.apiClient.response(status, {
            policies,
            budgetPolicies: entity.budgetPolicies ?? policies,
            upcoming: entity.upcoming ?? [],
          });
        }
      }
      if (status === StatusCodes.Http200 && Array.isArray(response)) {
        return this.apiClient.response(status, { policies: response as InsurancePolicy[], upcoming: [] });
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: Record<string, unknown>): SingleEntityResponse<InsurancePolicy> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      const entity = parsePolicyEntity(response);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && entity) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, entity);
      }
      return recordFailure(status, response);
    } catch (err) {
      console.error('[insurance] create', err);
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async update(id: number, data: Record<string, unknown>): SingleEntityResponse<InsurancePolicy> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      const entity = parsePolicyEntity(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
      return recordFailure(status, response);
    } catch (err) {
      console.error('[insurance] update', err);
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async delete(id: number): SingleEntityResponse<InsurancePolicy> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
      const entity = parsePolicyEntity(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
      if (status === StatusCodes.Http204) {
        return null;
      }
      return recordFailure(status, response);
    } catch (err) {
      console.error('[insurance] delete', err);
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }
}
