import type { ApiClient } from '../api-client';
import { StatusCodes } from '../response';
import { isValidationErrorApiResponse, unwrapApiCollection, unwrapApiEntity } from '../type-guards';
import type { FeedbackCategory } from '@/config/feedback';
import type { FeedbackReport } from '@/types/feedback';

export type SubmitFeedbackPayload = {
  category: FeedbackCategory;
  message: string;
  subject?: string;
  pageUrl?: string;
  files?: File[];
};

export type SubmitFeedbackResult =
  | { success: true; data: FeedbackReport }
  | { success: false; message: string };

export type FeedbackMineResult = {
  items: FeedbackReport[];
  unreadCount: number;
};

function firstValidationError(response: unknown): string | null {
  if (!isValidationErrorApiResponse(response)) return null;
  const first = Object.values(response.errors).flat()[0];
  return typeof first === 'string' ? first : null;
}

export class FeedbackClient {
  constructor(protected apiClient: ApiClient) {}

  async listMine(): Promise<FeedbackMineResult | null> {
    try {
      const [status, response] = await this.apiClient.getJson('feedback-reports/mine');
      const items = unwrapApiCollection<FeedbackReport>(response, ['id']);
      if (status === StatusCodes.Http200 && items) {
        const unreadCount =
          typeof response === 'object' &&
          response !== null &&
          'meta' in response &&
          typeof (response as { meta?: { unreadCount?: number } }).meta?.unreadCount === 'number'
            ? (response as { meta: { unreadCount: number } }).meta.unreadCount
            : 0;
        return { items, unreadCount };
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async show(id: number): Promise<FeedbackReport | null> {
    try {
      const [status, response] = await this.apiClient.getJson(`feedback-reports/${id}`);
      const entity = unwrapApiEntity<FeedbackReport>(response, ['id']);
      if (status === StatusCodes.Http200 && entity) return entity;
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async sendMessage(id: number, body: string): Promise<FeedbackReport | null> {
    try {
      const [status, response] = await this.apiClient.postJson(`feedback-reports/${id}/messages`, { body });
      const entity = unwrapApiEntity<FeedbackReport>(response, ['id']);
      if (status === StatusCodes.Http200 && entity) return entity;
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async submit(payload: SubmitFeedbackPayload): Promise<SubmitFeedbackResult | null> {
    try {
      const form = new FormData();
      form.append('category', payload.category);
      form.append('message', payload.message);
      if (payload.subject?.trim()) form.append('subject', payload.subject.trim());
      if (payload.pageUrl?.trim()) form.append('page_url', payload.pageUrl.trim());

      (payload.files ?? []).forEach((file, index) => {
        form.append(`files[${index}]`, file, file.name);
      });

      const [status, response] = await this.apiClient.postFormData('feedback-reports', form);

      if (status === StatusCodes.Http422) {
        return {
          success: false,
          message: firstValidationError(response) ?? 'Érvénytelen adatok (pl. fájltípus vagy méret).',
        };
      }

      const entity = unwrapApiEntity<FeedbackReport>(response, ['id']);
      if (status === StatusCodes.Http201 && entity) {
        return { success: true, data: entity };
      }

      return { success: false, message: 'A bejelentés küldése nem sikerült.' };
    } catch (err) {
      console.log('err', err);
      return null;
    }
  }
}
