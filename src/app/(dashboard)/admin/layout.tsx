'use client';

import { AdminGuard } from '@/components/modules/admin/AdminGuard';
import { AdminUiProvider } from '@/components/modules/admin/AdminUiContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminUiProvider>{children}</AdminUiProvider>
    </AdminGuard>
  );
}
