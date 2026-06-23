'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/Toaster';

export function ConditionalToaster() {
  const pathname = usePathname();
  if (pathname.startsWith('/maintenance')) {
    return null;
  }
  return <Toaster />;
}
