'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  clearImpersonationSession,
  getImpersonationOriginToken,
  getImpersonationTargetLabel,
  isImpersonating,
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

  useEffect(() => {
    setActive(isImpersonating());
    setTargetLabel(getImpersonationTargetLabel());
  }, []);

  const handleEndImpersonation = useCallback(async () => {
    const originToken = getImpersonationOriginToken();
    if (!originToken) {
      clearImpersonationSession();
      setActive(false);
      return;
    }

    setEnding(true);
    try {
      clearImpersonationSession();
      setAuthToken(originToken);
      resetSessionData();
      useAdminStore.getState().reset();
      await fetchMe();
      setActive(false);
      addNotification('Megszemélyesítés befejezve.', 'success');
      router.push('/admin/users');
    } catch {
      addNotification('A visszatérés nem sikerült. Jelentkezz be újra admin fiókkal.', 'error');
    } finally {
      setEnding(false);
    }
  }, [addNotification, fetchMe, router, setAuthToken]);

  if (!active) return null;

  return (
    <div className="sticky top-0 z-[60] border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-950 dark:text-amber-100 min-w-0">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="truncate">
            Megszemélyesítés aktív{targetLabel ? `: ${targetLabel}` : ''}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-500/40 bg-background/80"
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
