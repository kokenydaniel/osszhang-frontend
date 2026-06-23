
const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;

export function getPublicEnv() {
  return env;
}

export type PublicEnv = typeof env;
