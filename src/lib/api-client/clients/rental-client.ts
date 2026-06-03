import type { ApiClient } from '../api-client';
import { StatusCodes, type SingleEntityResponse, isSingleEntityApiResponse } from '../response';
import { unwrapApiEntity } from '../type-guards';
import { getApiErrorMessage } from '@/helpers/api-error-message';
import type {
  RentalExpense,
  RentalIncomeEntry,
  RentalIndexResponse,
  RentalProperty,
} from '@/types/rental';
import type { RequestOptions } from '../response';

export type RentalApiFailure = { status: string; message: string };

let lastFailure: RentalApiFailure | null = null;

export function getLastRentalApiFailure(): RentalApiFailure | null {
  return lastFailure;
}

function recordFailure(status: string, response: object | null): null {
  lastFailure = { status, message: getApiErrorMessage(status, response) };
  return null;
}

function parseIndex(response: object | null): RentalIndexResponse | null {
  if (!response || typeof response !== 'object') return null;
  const body = response as RentalIndexResponse & { data?: RentalIndexResponse };
  const entity = Array.isArray(body.properties)
    ? body
    : body.data && Array.isArray(body.data.properties)
      ? body.data
      : null;
  if (!entity) return null;
  const summary = entity.summary ?? {};
  return {
    properties: entity.properties ?? [],
    incomeEntries: entity.incomeEntries ?? [],
    expenses: entity.expenses ?? [],
    summary: {
      expectedRent: summary.expectedRent ?? 0,
      expectedCommonCost: summary.expectedCommonCost ?? 0,
      expectedGross: summary.expectedGross ?? 0,
      commonCostTotal: summary.commonCostTotal ?? 0,
      expectedNet: summary.expectedNet ?? 0,
      ownerExpenses: summary.ownerExpenses ?? 0,
      received: summary.received ?? 0,
      outstanding: summary.outstanding ?? 0,
      propertyCount: summary.propertyCount ?? 0,
      paidCount: summary.paidCount ?? 0,
      recordedCount: summary.recordedCount ?? 0,
      unpaidCount: summary.unpaidCount ?? 0,
    },
    upcomingContractEnds: entity.upcomingContractEnds ?? [],
    overdueRents: entity.overdueRents ?? [],
    selectedYear: entity.selectedYear ?? new Date().getFullYear(),
    selectedMonth: entity.selectedMonth ?? new Date().getMonth() + 1,
  };
}

function parseProperty(response: object | null): RentalProperty | null {
  return (
    unwrapApiEntity<RentalProperty>(response, ['id', 'name']) ??
    (isSingleEntityApiResponse<RentalProperty>(response, ['id', 'name']) ? response : null)
  );
}

function parseIncome(response: object | null): RentalIncomeEntry | null {
  return (
    unwrapApiEntity<RentalIncomeEntry>(response, ['id', 'rentalPropertyId']) ??
    (isSingleEntityApiResponse<RentalIncomeEntry>(response, ['id', 'rentalPropertyId']) ? response : null)
  );
}

function parseExpense(response: object | null): RentalExpense | null {
  return (
    unwrapApiEntity<RentalExpense>(response, ['id', 'rentalPropertyId']) ??
    (isSingleEntityApiResponse<RentalExpense>(response, ['id', 'rentalPropertyId']) ? response : null)
  );
}

export class RentalClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'rental-properties') {}

  async getIndex(
    year: number,
    month: number,
    options?: RequestOptions,
  ): SingleEntityResponse<RentalIndexResponse> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.getJson(
        `${this.baseEndpoint}?year=${year}&month=${month}`,
        options,
      );
      const entity = parseIndex(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
      return recordFailure(status, response);
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async createProperty(data: Record<string, unknown>): SingleEntityResponse<RentalProperty> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      const entity = parseProperty(response);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && entity) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, entity);
      }
      return recordFailure(status, response);
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async updateProperty(id: number, data: Record<string, unknown>): SingleEntityResponse<RentalProperty> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      const entity = parseProperty(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
      return recordFailure(status, response);
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async deleteProperty(id: number): SingleEntityResponse<RentalProperty> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
      const entity = parseProperty(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
      return recordFailure(status, response);
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async createIncome(data: Record<string, unknown>): SingleEntityResponse<RentalIncomeEntry> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.postJson('rental-income-entries', data);
      const entity = parseIncome(response);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && entity) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, entity);
      }
      return recordFailure(status, response);
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async updateIncome(id: number, data: Record<string, unknown>): SingleEntityResponse<RentalIncomeEntry> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.putJson(`rental-income-entries/${id}`, data);
      const entity = parseIncome(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
      return recordFailure(status, response);
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async deleteIncome(id: number): Promise<boolean> {
    lastFailure = null;
    try {
      const [status] = await this.apiClient.deleteJson(`rental-income-entries/${id}`);
      return status === StatusCodes.Http204 || status === StatusCodes.Http200;
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return false;
  }

  async createExpense(data: Record<string, unknown>): SingleEntityResponse<RentalExpense> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.postJson('rental-expenses', data);
      const entity = parseExpense(response);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && entity) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, entity);
      }
      return recordFailure(status, response);
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async updateExpense(id: number, data: Record<string, unknown>): SingleEntityResponse<RentalExpense> {
    lastFailure = null;
    try {
      const [status, response] = await this.apiClient.putJson(`rental-expenses/${id}`, data);
      const entity = parseExpense(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
      return recordFailure(status, response);
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return null;
  }

  async deleteExpense(id: number): Promise<boolean> {
    lastFailure = null;
    try {
      const [status] = await this.apiClient.deleteJson(`rental-expenses/${id}`);
      return status === StatusCodes.Http204 || status === StatusCodes.Http200;
    } catch {
      lastFailure = { status: '500', message: getApiErrorMessage('500', null) };
    }
    return false;
  }
}
