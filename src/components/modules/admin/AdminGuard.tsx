'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { isStoreLoading } from '@/lib/loadableStatus';
import { isPlatformAdmin } from '@/lib/platformAdmin';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, status } = useAuthStore();

  useEffect(() => {
    if (isStoreLoading(status)) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isPlatformAdmin(user)) {
      router.replace('/');
    }
  }, [router, status, user]);

  if (isStoreLoading(status) || !user || !isPlatformAdmin(user)) {
    return null;
  }

  return <>{children}</>;
}
