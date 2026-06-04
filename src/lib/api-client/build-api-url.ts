import { API_URL, normalizeApiUrl } from '@/lib/api-client/public-env';

export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  baseUrl: string = API_URL,
): string {
  const normalized = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = new URL(normalized, `${normalizeApiUrl(baseUrl)}/`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}
