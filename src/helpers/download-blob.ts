import { getAuthToken } from '@/helpers/auth-token';
import { buildApiUrl } from '@/lib/api-client/build-api-url';
import { API_URL } from '@/lib/api-client/public-env';

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const safeName = filename.trim() || 'letoltes';
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = safeName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function isJsonErrorPayload(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.includes('application/json') || contentType.includes('text/json');
}

function buildProxyDownloadUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const normalized = endpoint.replace(/^\/+/, '');
  const url = new URL(`/api/files/${normalized}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function fetchDownload(url: string, token: string | null): Promise<Response> {
  return fetch(url, {
    method: 'GET',
    headers: token
      ? { Authorization: `Bearer ${token}`, Accept: '*/*' }
      : { Accept: '*/*' },
    cache: 'no-store',
  });
}

export async function downloadAuthenticatedFile(
  endpoint: string,
  filename: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<boolean> {
  if (!endpoint.trim()) {
    return false;
  }

  const token = getAuthToken();
  const directUrl = buildApiUrl(endpoint, params, API_URL);
  const proxyUrl = buildProxyDownloadUrl(endpoint, params);

  try {
    let response = await fetchDownload(directUrl, token);

    if (!response.ok && typeof window !== 'undefined') {
      response = await fetchDownload(proxyUrl, token);
    }

    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('Content-Type');
    if (isJsonErrorPayload(contentType)) {
      return false;
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      return false;
    }

    const fromHeader = response.headers.get('Content-Disposition');
    const headerName = fromHeader?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
    const decodedName = headerName ? decodeURIComponent(headerName) : filename;

    triggerBrowserDownload(blob, decodedName);
    return true;
  } catch {
    return false;
  }
}
