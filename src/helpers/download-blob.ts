import { API_URL } from '@/lib/api-client/public-env';
import { getAuthToken } from '@/helpers/auth-token';

export async function downloadAuthenticatedFile(endpoint: string, filename: string): Promise<boolean> {
  const normalized = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = new URL(normalized, `${API_URL.replace(/\/$/, '')}/`);
  const token = getAuthToken();

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}`, Accept: '*/*' } : { Accept: '*/*' },
  });

  if (!response.ok) {
    return false;
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);

  return true;
}
