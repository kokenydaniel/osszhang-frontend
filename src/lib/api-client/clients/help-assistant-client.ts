import type { ApiClient } from '../api-client';
import { ApiClientNetworkError } from '../api-client';
import { StatusCodes } from '../response';
import { getApiErrorMessage } from '@/helpers/api-error-message';

const HELP_ASSISTANT_TIMEOUT_MS = 90_000;

export type HelpAssistantLink = {
  label: string;
  path: string;
  kind: 'module' | 'settings' | 'pricing' | 'help';
};

export type HelpAssistantChatResponse = {
  status: 'answered' | 'rejected';
  message: string;
  links: HelpAssistantLink[];
};

export type HelpAssistantHistoryEntry = {
  role: 'user' | 'assistant';
  content: string;
};

export type HelpAssistantChatResult =
  | { ok: true; data: HelpAssistantChatResponse }
  | { ok: false; message: string };

export class HelpAssistantClient {
  constructor(protected apiClient: ApiClient) {}

  async chat(
    message: string,
    history: HelpAssistantHistoryEntry[] = [],
  ): Promise<HelpAssistantChatResult> {
    try {
      const [status, response] = await this.apiClient.postJson(
        'help/assistant',
        { message, history },
        { timeoutMs: HELP_ASSISTANT_TIMEOUT_MS },
      );

      if (status === StatusCodes.Http200 && response && typeof response === 'object') {
        const body = response as Partial<HelpAssistantChatResponse>;
        if (typeof body.message === 'string') {
          return {
            ok: true,
            data: {
              status: body.status === 'rejected' ? 'rejected' : 'answered',
              message: body.message,
              links: Array.isArray(body.links) ? (body.links as HelpAssistantLink[]) : [],
            },
          };
        }
      }

      if (status === StatusCodes.Http404) {
        return {
          ok: false,
          message:
            'A súgó asszisztens még nincs telepítve a szerveren. Frissítsd a backendet, vagy nézd meg addig a /help oldalt.',
        };
      }

      return {
        ok: false,
        message: getApiErrorMessage(
          status,
          response,
          'A súgó asszisztens jelenleg nem érhető el. Próbáld újra később.',
        ),
      };
    } catch (error) {
      if (error instanceof ApiClientNetworkError) {
        return {
          ok: false,
          message: error.message,
        };
      }

      return {
        ok: false,
        message: 'Váratlan hiba történt a súgó asszisztens hívásakor. Próbáld újra később.',
      };
    }
  }
}
