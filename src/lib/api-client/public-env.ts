const PRODUCTION_API_URL = 'https://osszhang-backend.fly.dev/api';

export function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

function resolveApiUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;

  if (process.env.NODE_ENV === 'production') {
    if (fromEnv && fromEnv.includes('osszhang-backend')) {
      return normalizeApiUrl(fromEnv);
    }

    return PRODUCTION_API_URL;
  }

  return fromEnv ? normalizeApiUrl(fromEnv) : 'http://localhost:8000/api';
}

export const API_URL = resolveApiUrl();
