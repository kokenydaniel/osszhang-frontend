const ORIGIN_TOKEN_KEY = 'admin_impersonation_origin_token';
const TARGET_LABEL_KEY = 'admin_impersonation_target_label';

export function isImpersonating(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(sessionStorage.getItem(ORIGIN_TOKEN_KEY));
}

export function getImpersonationOriginToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ORIGIN_TOKEN_KEY);
}

export function getImpersonationTargetLabel(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TARGET_LABEL_KEY);
}

export function startImpersonationSession(originToken: string, targetLabel: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ORIGIN_TOKEN_KEY, originToken);
  sessionStorage.setItem(TARGET_LABEL_KEY, targetLabel);
}

export function clearImpersonationSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ORIGIN_TOKEN_KEY);
  sessionStorage.removeItem(TARGET_LABEL_KEY);
}
