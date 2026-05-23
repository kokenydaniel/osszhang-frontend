const PRODUCTION_API_URL = 'https://penzpilot-backend.fly.dev/api';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : 'http://localhost:8000/api');
