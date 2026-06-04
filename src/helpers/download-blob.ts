import { API_URL } from '@/lib/api-client/public-env';
import { getAuthToken } from '@/helpers/auth-token';

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

export async function downloadAuthenticatedFile(endpoint: string, filename: string): Promise<boolean> {
  const normalized = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = new URL(normalized, `${API_URL.replace(/\/$/, '')}/`);
  const token = getAuthToken();

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}`, Accept: '*/*' } : { Accept: '*/*' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      return false;
    }

    triggerBrowserDownload(blob, filename);
    return true;
  } catch {
    return false;
  }
}
