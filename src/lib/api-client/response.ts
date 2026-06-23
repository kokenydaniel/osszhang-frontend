export * from '@/types/api';

export {
  isObject,
  isArray,
  isString,
  isObjectInstanceByProperties,
  isSingleEntityApiResponse,
  isCollectionApiResponse,
  isValidationErrorApiResponse,
  isGeneralErrorApiResponse,
} from './type-guards';

export function isMaintenanceModeResponse(status: string | number, data: unknown): boolean {
  if (status !== 503 && status !== '503') return false;
  const payload = (data ?? {}) as import('@/types/api').MaintenanceErrorPayload;
  return payload.code === 'MAINTENANCE_MODE';
}

export function redirectToMaintenanceIfNeeded(status: string | number, data: unknown): void {
  if (!isMaintenanceModeResponse(status, data)) return;
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/maintenance')) return;
  window.location.href = '/maintenance';
}
