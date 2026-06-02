'use client';

import React, { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getAuthToken } from '@/helpers/auth-token';
import { LoadableStatus } from '@/utils/loadable-status';
import { isMaintenanceBlockedForUser } from '@/config/platform-feature-flags';
import { syncBudgetCategories } from '@/helpers/session-bootstrap';
import type { UserProfile } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';

interface AuthProviderProps extends PropsWithChildren {
  validateUser?: (user: UserProfile) => boolean;
  loaderComponent?: ReactNode | null;
}

function DefaultAuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Betöltés" />
    </div>
  );
}

export function AuthProvider({
  children,
  validateUser,
  loaderComponent = <DefaultAuthLoader />,
}: AuthProviderProps) {
  const setAuthToken = useAuthStore((s) => s.setAuthToken);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const setStatus = useAuthStore((s) => s.setStatus);
  const logout = useAuthStore((s) => s.logout);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    setAuthToken(token);

    if (!token) {
      setIsLoaded(true);
      setStatus(LoadableStatus.Loaded);
      return;
    }

    fetchMe()
      ?.then((user) => {
        if (!user) return;
        if (isMaintenanceBlockedForUser(user)) {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/maintenance')) {
            window.location.replace('/maintenance');
          }
          return;
        }
        syncBudgetCategories(user);
        useWalletStore.getState().syncFromUser(user.wallets, user.household?.id);
        if (validateUser && !validateUser(user)) {
          void logout();
        }
      })
      .finally(() => setIsLoaded(true));
  }, [fetchMe, logout, setAuthToken, setStatus, validateUser]);

  return isLoaded ? children : loaderComponent;
}
