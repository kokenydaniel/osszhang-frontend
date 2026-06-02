import { getAuthToken } from '@/helpers/auth-token';
import { API_URL } from './public-env';
import type { ApiClientResponse, SupportedStatusCodes, RequestOptions } from './response';

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

  protected async fetch(endpoint: string, init?: NextConfigAwareRequestInit, options?: RequestOptions) {
    const requestInit: NextConfigAwareRequestInit = {
      next: {
        revalidate: this.fetchCache,
        ...(init?.next ?? {}),
      },
      ...(init ?? {}),
    };

    requestInit.headers = {
      ...this.getDefaultHeaders(),
      ...(requestInit.headers || {}),
    };

    return fetch(this.buildUrl(endpoint, options?.params), requestInit);
  }

  protected async parseBody(response: Response): Promise<object | null> {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      // If it's not JSON, we return an object wrapping the text to maintain the tuple type [string, object | null]
      return { text };
    }
  }

  async getJson(endpoint: string, options?: RequestOptions): Promise<[string, object | null]> {
    try {
      const response = await this.fetch(endpoint, { method: 'GET' }, options);
      const data = await this.parseBody(response);
      return [response.status.toString(), data];
    } catch (err) {
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
}
