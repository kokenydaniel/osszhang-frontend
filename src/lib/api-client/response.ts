export interface ApiResponse<T> {
  data: T;
  status: number;
}

export type RequestOptions = {
  silent?: boolean;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Request timeout in milliseconds. Defaults to 45s; AI endpoints use 120s. */
  timeoutMs?: number;
};

export type MaintenanceErrorPayload = {
  message?: string;
  code?: string;
};

export function isMaintenanceModeResponse(status: number, data: unknown): boolean {
  if (status !== 503) return false;
  const payload = (data ?? {}) as MaintenanceErrorPayload;
  return payload.code === 'MAINTENANCE_MODE';
}

export function redirectToMaintenanceIfNeeded(status: number, data: unknown): void {
  if (!isMaintenanceModeResponse(status, data)) return;
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/maintenance')) return;
  window.location.href = '/maintenance';
}
