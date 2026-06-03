import type { ApiClient } from '../api-client';
import { StatusCodes, type CollectionResponse, type EmptyResponse } from '../response';
import type { RequestOptions } from '../response';
import { unwrapApiCollection, unwrapApiEntity } from '../type-guards';
import type { FileAttachment } from '@/types/attachments';
import type { SingleEntityResponse } from '../response';

export class AttachmentsClient {
  constructor(protected apiClient: ApiClient) {}

  async listForLedger(ledgerEntryId: number): CollectionResponse<FileAttachment> {
    try {
      const [status, response] = await this.apiClient.getJson(`ledger-entries/${ledgerEntryId}/attachments`);
      const items = unwrapApiCollection<FileAttachment>(response, ['id']);
      if (status === StatusCodes.Http200 && items) {
        return this.apiClient.response(status, items);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async uploadToLedger(ledgerEntryId: number, file: File): SingleEntityResponse<FileAttachment> {
    try {
      const form = new FormData();
      form.append('file', file);
      const [status, response] = await this.apiClient.postFormData(
        `ledger-entries/${ledgerEntryId}/attachments`,
        form,
      );
      const entity = unwrapApiEntity<FileAttachment>(response, ['id']);
      if (status === StatusCodes.Http201 && entity) {
        return this.apiClient.response(StatusCodes.Http201, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteAttachment(attachmentId: number): EmptyResponse {
    try {
      const [status] = await this.apiClient.deleteJson(`attachments/${attachmentId}`);
      if (status === StatusCodes.Http200) {
        return this.apiClient.response(status as StatusCodes.Http200, null);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async downloadLedgerAttachment(ledgerEntryId: number, attachmentId: number, filename: string): Promise<boolean> {
    const { downloadAuthenticatedFile } = await import('@/helpers/download-blob');
    return downloadAuthenticatedFile(`attachments/${attachmentId}/download`, filename);
  }

  async listForInsurancePolicy(policyId: number): CollectionResponse<FileAttachment> {
    try {
      const [status, response] = await this.apiClient.getJson(`insurance-policies/${policyId}/attachments`);
      const items = unwrapApiCollection<FileAttachment>(response, ['id']);
      if (status === StatusCodes.Http200 && items) {
        return this.apiClient.response(status, items);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async uploadToInsurancePolicy(policyId: number, file: File): SingleEntityResponse<FileAttachment> {
    try {
      const form = new FormData();
      form.append('file', file);
      const [status, response] = await this.apiClient.postFormData(
        `insurance-policies/${policyId}/attachments`,
        form,
      );
      const entity = unwrapApiEntity<FileAttachment>(response, ['id']);
      if (status === StatusCodes.Http201 && entity) {
        return this.apiClient.response(StatusCodes.Http201, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async listForRentalProperty(propertyId: number): CollectionResponse<FileAttachment> {
    try {
      const [status, response] = await this.apiClient.getJson(
        `rental-properties/${propertyId}/attachments`,
      );
      const items = unwrapApiCollection<FileAttachment>(response, ['id']);
      if (status === StatusCodes.Http200 && items) {
        return this.apiClient.response(status, items);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async uploadToRentalProperty(propertyId: number, file: File): SingleEntityResponse<FileAttachment> {
    try {
      const form = new FormData();
      form.append('file', file);
      const [status, response] = await this.apiClient.postFormData(
        `rental-properties/${propertyId}/attachments`,
        form,
      );
      const entity = unwrapApiEntity<FileAttachment>(response, ['id']);
      if (status === StatusCodes.Http201 && entity) {
        return this.apiClient.response(StatusCodes.Http201, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
