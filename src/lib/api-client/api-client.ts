import { getAuthToken } from '@/helpers/auth-token';
import { buildApiUrl } from './build-api-url';
import { API_URL } from './public-env';
import type { ApiClientResponse, SupportedStatusCodes, RequestOptions } from './response';

export class ApiClientNetworkError extends Error {
  constructor(message = 'A backend szerver nem elérhető. Indítsd el: php artisan serve') {
    super(message);
    this.name = 'ApiClientNetworkError';
  }
}

export class InvalidConfiguration extends Error {}

interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

interface NextConfigAwareRequestInit extends RequestInit {
  next?: NextFetchRequestConfig | undefined;
}

export class ApiClient {
  constructor(protected baseUrl: string = API_URL, protected fetchCache = 60) {
    if (!baseUrl) {
      throw new InvalidConfiguration('ApiClient cannot be configured, baseUrl is missing.');
    }
  }

  response<S extends SupportedStatusCodes, T>(status: S, response: T): ApiClientResponse<S, T> {
    return [status, response];
  }

  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  protected buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    return buildApiUrl(endpoint, params, this.baseUrl);
  }

  protected async fetch(endpoint: string, init?: NextConfigAwareRequestInit, options?: RequestOptions) {
    const requestInit: NextConfigAwareRequestInit = {
      next: {
        revalidate: this.fetchCache,
        ...(init?.next ?? {}),
      },
      ...(init ?? {}),
    };

    const defaultHeaders = this.getDefaultHeaders();
    if (requestInit.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    requestInit.headers = {
      ...defaultHeaders,
      ...(requestInit.headers || {}),
    };

    try {
      return await fetch(this.buildUrl(endpoint, options?.params), requestInit);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new ApiClientNetworkError();
      }
      throw err;
    }
  }

  protected async parseBody(response: Response): Promise<object | null> {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {

      return { text };
    }
  }

  async getJson(endpoint: string, options?: RequestOptions): Promise<[string, object | null]> {
    try {
      const response = await this.fetch(endpoint, { method: 'GET' }, options);
      const data = await this.parseBody(response);
      return [response.status.toString(), data];
    } catch (err) {
      if (err instanceof ApiClientNetworkError) {
        throw err;
      }
      console.log('ApiClient GET Error:', err);
      return ['500', null];
    }
  }

  async post(
    endpoint: string,
    body: BodyInit | FormData | null = null,
    headers?: HeadersInit,
    options?: RequestOptions
  ): Promise<[string, object | null]> {
    try {
      const requestInit: NextConfigAwareRequestInit = {
        method: 'POST',
        body,
      };
      if (headers) {
        requestInit.headers = headers;
      }
      const response = await this.fetch(endpoint, requestInit, options);
      const data = await this.parseBody(response);
      return [response.status.toString(), data];
    } catch (err) {
      if (err instanceof ApiClientNetworkError) {
        throw err;
      }
      console.log('ApiClient POST Error:', err);
      return ['500', null];
    }
  }

  async postJson(
    endpoint: string,
    body: object | null = null,
    options?: RequestOptions
  ): Promise<[string, object | null]> {
    return this.post(
      endpoint,
      body ? JSON.stringify(body) : null,
      { 'Content-Type': 'application/json;charset=UTF-8' },
      options
    );
  }

  async putJson(
    endpoint: string,
    body: object | null = null,
    options?: RequestOptions
  ): Promise<[string, object | null]> {
    try {
      const response = await this.fetch(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : null,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      }, options);
      const data = await this.parseBody(response);
      return [response.status.toString(), data];
    } catch (err) {
      console.log('ApiClient PUT Error:', err);
      return ['500', null];
    }
  }

  async patchJson(
    endpoint: string,
    body: object | null = null,
    options?: RequestOptions
  ): Promise<[string, object | null]> {
    try {
      const response = await this.fetch(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : null,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      }, options);
      const data = await this.parseBody(response);
      return [response.status.toString(), data];
    } catch (err) {
      console.log('ApiClient PATCH Error:', err);
      return ['500', null];
    }
  }

  async deleteJson(
    endpoint: string,
    body: object | null = null,
    options?: RequestOptions
  ): Promise<[string, object | null]> {
    try {
      const response = await this.fetch(endpoint, {
        method: 'DELETE',
        body: body ? JSON.stringify(body) : null,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      }, options);
      const data = await this.parseBody(response);
      return [response.status.toString(), data];
    } catch (err) {
      console.log('ApiClient DELETE Error:', err);
      return ['500', null];
    }
  }

  async postFormData(endpoint: string, formData: FormData, options?: RequestOptions): Promise<[string, object | null]> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return this.post(endpoint, formData, headers, options);
  }

  async downloadBlob(endpoint: string, options?: RequestOptions): Promise<Response | null> {
    try {
      const headers: Record<string, string> = { Accept: '*/*' };
      const token = getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(this.buildUrl(endpoint, options?.params), {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
      if (!response.ok) {
        return null;
      }
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        return null;
      }
      return response;
    } catch (err) {
      console.log('ApiClient downloadBlob Error:', err);
      return null;
    }
  }
}
