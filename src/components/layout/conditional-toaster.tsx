'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/Toaster';

/** Hide toast UI on the maintenance screen (no background API noise). */
export function ConditionalToaster() {
  const pathname = usePathname();
  if (pathname.startsWith('/maintenance')) {
    return null;
  }
  return <Toaster />;
}
