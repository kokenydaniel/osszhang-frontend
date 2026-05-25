import { useNotificationStore } from '@/stores/useNotificationStore';
import { getAuthToken, removeAuthToken } from '@/lib/authToken';
import { isAbortError, isTimeoutError, mergeAbortSignals } from '@/lib/api-client/abortError';
import { API_URL } from './public-env';
import type { ApiResponse, RequestOptions } from './response';

export { isAbortError, isTimeoutError } from '@/lib/api-client/abortError';

export class ApiClientError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown, message?: string) {
    super(message || 'API request failed');
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

type ApiErrorPayload = {
  errors?: Record<string, string[]>;
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback = 'Váratlan hiba történt.'): string {
  if (error instanceof ApiClientError) {
    const payload = (error.data ?? {}) as ApiErrorPayload;
    if (payload.errors) {
      const joined = Object.values(payload.errors).flat().filter(Boolean).join(' ');
      if (joined) return joined;
    }
    if (payload.message) return payload.message;
    if (error.status === 401) return 'Hibás felhasználónév vagy jelszó.';
    if (error.status >= 500) return 'Szerver hiba történt. Próbáld újra később.';
  }

  if (isTimeoutError(error)) {
    return 'A kérés túl sokáig tartott. Próbáld újra!';
  }

  if (error instanceof Error && error.message && error.message !== 'API request failed') {
    return error.message;
  }

  return fallback;
}

export class ApiClient {
  constructor(protected baseUrl: string = API_URL) {
    if (!baseUrl) {
      throw new Error('ApiClient cannot be configured, baseUrl is missing.');
    }
  }

  protected getDefaultHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  protected buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    const normalized = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = new URL(normalized, `${this.baseUrl.replace(/\/$/, '')}/`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  protected async parseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  protected handleHttpError(status: number, data: unknown, silent?: boolean): never {
    const { addNotification } = useNotificationStore.getState();
    const payload = (data ?? {}) as { errors?: Record<string, string[]>; message?: string };

    if (!silent) {
      switch (status) {
        case 401:
          if (typeof window !== 'undefined') {
            removeAuthToken();
            addNotification('A munkamenet lejárt. Kérjük, jelentkezz be újra.', 'error');
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              window.location.href = '/login';
            }
          }
          break;
        case 403:
          addNotification('Nincs jogosultságod a művelethez!', 'error');
          break;
        case 422: {
          const errors = payload.errors ? Object.values(payload.errors).flat().join(' ') : 'Érvénytelen adatok.';
          addNotification(errors, 'error');
          break;
        }
        case 429:
          addNotification('Túl sok kérés! Próbáld újra később.', 'info');
          break;
        case 500:
          addNotification('Szerver hiba történt. Dolgozunk a javításon!', 'error');
          break;
        default:
          addNotification(payload.message || 'Váratlan hiba történt.', 'error');
      }
    }

    throw new ApiClientError(status, data);
  }

  protected async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const timeoutController = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (typeof window !== 'undefined') {
      timeout = setTimeout(() => {
        timeoutController.abort(new DOMException('The request timed out.', 'TimeoutError'));
      }, 30000);
    }

    const signals = [timeoutController.signal];
    if (options?.signal) {
      signals.push(options.signal);
    }
    const signal = mergeAbortSignals(signals);

    try {
      const response = await fetch(this.buildUrl(endpoint, options?.params), {
        method,
        headers: this.getDefaultHeaders(),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });

      const data = await this.parseBody(response);

      if (!response.ok) {
        this.handleHttpError(response.status, data, options?.silent);
      }

      return { data: data as T, status: response.status };
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      if (isAbortError(error)) {
        throw error;
      }

      const { addNotification } = useNotificationStore.getState();
      if (!options?.silent) {
        if (isTimeoutError(error)) {
          addNotification('A kérés túl sokáig tartott. Próbáld újra!', 'error');
        } else {
          addNotification('Hálózati hiba! Ellenőrizd az internetkapcsolatot.', 'error');
        }
      }

      throw error;
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
    }
  }

  getJson<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  postJson<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('POST', endpoint, body, options);
  }

  putJson<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('PUT', endpoint, body, options);
  }

  deleteJson<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('DELETE', endpoint, body, options);
  }
}
