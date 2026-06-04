import type { ApiClient } from '../api-client';
import { StatusCodes, type SingleEntityResponse } from '../response';
import { unwrapApiEntity } from '../type-guards';
import type {
  CreateReceivableContactPayload,
  CreateReceivableEntryPayload,
  ReceivableContact,
  ReceivablesIndexResponse,
} from '@/types/receivables';

function parseIndex(response: object | null): ReceivablesIndexResponse | null {
  if (!response || typeof response !== 'object') return null;
  const body = response as ReceivablesIndexResponse & { data?: ReceivablesIndexResponse };
  const entity = Array.isArray(body.contacts)
    ? body
    : body.data && Array.isArray(body.data.contacts)
      ? body.data
      : null;
  if (!entity) return null;
  const summary = entity.summary ?? {};
  return {
    contacts: entity.contacts ?? [],
    summary: {
      totalLent: summary.totalLent ?? 0,
      totalRepaid: summary.totalRepaid ?? 0,
      totalOutstanding: summary.totalOutstanding ?? 0,
      openContactCount: summary.openContactCount ?? 0,
      contactCount: summary.contactCount ?? 0,
    },
  };
}

function parseContact(response: object | null): ReceivableContact | null {
  return unwrapApiEntity<ReceivableContact>(response, ['id', 'name']);
}

export class ReceivablesClient {
  constructor(protected apiClient: ApiClient) {}

  async index(): SingleEntityResponse<ReceivablesIndexResponse> {
    try {
      const [status, response] = await this.apiClient.getJson('receivables');
      const entity = parseIndex(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async createContact(payload: CreateReceivableContactPayload): SingleEntityResponse<ReceivableContact> {
    try {
      const [status, response] = await this.apiClient.postJson('receivables/contacts', payload);
      const entity = parseContact(response);
      if (status === StatusCodes.Http201 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateContact(
    id: number,
    payload: Partial<CreateReceivableContactPayload>,
  ): SingleEntityResponse<ReceivableContact> {
    try {
      const [status, response] = await this.apiClient.patchJson(`receivables/contacts/${id}`, payload);
      const entity = parseContact(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteContact(id: number): SingleEntityResponse<ReceivableContact> {
    try {
      const [status, response] = await this.apiClient.deleteJson(`receivables/contacts/${id}`);
      const entity = parseContact(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async createEntry(
    contactId: number,
    payload: CreateReceivableEntryPayload,
  ): SingleEntityResponse<ReceivableContact> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `receivables/contacts/${contactId}/entries`,
        payload,
      );
      const entity = parseContact(response);
      if (status === StatusCodes.Http201 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateEntry(
    entryId: number,
    payload: Partial<CreateReceivableEntryPayload>,
  ): SingleEntityResponse<ReceivableContact> {
    try {
      const [status, response] = await this.apiClient.patchJson(`receivables/entries/${entryId}`, payload);
      const entity = parseContact(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteEntry(entryId: number): SingleEntityResponse<ReceivableContact> {
    try {
      const [status, response] = await this.apiClient.deleteJson(`receivables/entries/${entryId}`);
      const entity = parseContact(response);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
