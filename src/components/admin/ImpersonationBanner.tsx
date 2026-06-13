'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogOut } from 'lucide-react';
import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  clearImpersonationSession,
  getImpersonationOriginToken,
  IMPERSONATION_SESSION_CHANGED,
  readImpersonationSessionState,
} from '@/helpers/impersonation-session';
import { resetSessionData } from '@/helpers/reset-session-data';
import { useAdminStore } from '@/stores/useAdminStore';

export function ImpersonationBanner() {
  const router = useRouter();
  const { fetchMe, setAuthToken } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [active, setActive] = useState(false);
  const [targetLabel, setTargetLabel] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const syncSessionState = useCallback(() => {
    const { active: isActive, targetLabel: label } = readImpersonationSessionState();
    setActive(isActive);
    setTargetLabel(label);
  }, []);

  useEffect(() => {
    syncSessionState();
    window.addEventListener(IMPERSONATION_SESSION_CHANGED, syncSessionState);
    return () => window.removeEventListener(IMPERSONATION_SESSION_CHANGED, syncSessionState);
  }, [syncSessionState]);

  const handleEndImpersonation = useCallback(async () => {
    const originToken = getImpersonationOriginToken();
    if (!originToken) {
      clearImpersonationSession();
      return;
    }

    setEnding(true);
    try {
      clearImpersonationSession();
      setAuthToken(originToken);
      resetSessionData();
      useAdminStore.getState().reset();
      await fetchMe();
      addNotification('Megszemélyesítés befejezve.', 'success');
      router.push('/admin/households');
    } catch {
      addNotification('A visszatérés nem sikerült. Jelentkezz be újra admin fiókkal.', 'error');
    } finally {
      setEnding(false);
    }
  }, [addNotification, fetchMe, router, setAuthToken]);

  if (!active) return null;

  return (
    <div
      className={classNames(
        'sticky top-0 z-[70] w-full border-b px-4 py-3 shadow-sm',
        'border-amber-400/80 bg-amber-100 text-amber-950',
        'dark:border-amber-500/50 dark:bg-amber-950 dark:text-amber-50',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-100">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              Megszemélyesítés
            </p>
            <p className="truncate text-sm font-semibold leading-snug text-amber-950 dark:text-amber-50">
              {targetLabel ? `${targetLabel} fiókjában vagy` : 'Admin nézet aktív'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className={classNames(
            'shrink-0 border-amber-500/60 bg-white font-semibold text-amber-950 hover:bg-amber-50',
            'dark:border-amber-400/50 dark:bg-amber-900 dark:text-amber-50 dark:hover:bg-amber-800',
          )}
          onClick={() => void handleEndImpersonation()}
          loading={ending}
        >
          <LogOut size={14} />
          Vissza admin módba
        </Button>
      </div>
    </div>
  );
}
