'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useAdminUi } from '@/components/modules/admin/AdminUiContext';
import { AdminUserDetailPanel } from '@/components/modules/admin/admin-user-detail-panel';
import type { AdminUser } from '@/types/admin';

interface AdminUserDetailDrawerProps {
  user: AdminUser | null;
  canManageUser: (user: AdminUser) => boolean;
}

export function AdminUserDetailDrawer({ user, canManageUser }: AdminUserDetailDrawerProps) {
  const ui = useAdminUi();

  return (
    <Sheet open={ui.drawerOpen} onOpenChange={(open) => !open && ui.closeUserDrawer()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Felhasználó részletei</SheetTitle>
          <SheetDescription>Platform szintű felhasználói adatok és műveletek.</SheetDescription>
        </SheetHeader>
        {user ? (
          <div className="px-4 pb-6">
            <AdminUserDetailPanel
              user={user}
              canManage={canManageUser(user)}
              onActivate={() => ui.openActivateModal(user)}
              onDeactivate={() => ui.openDeactivateModal(user)}
              onImpersonate={() => ui.openImpersonateModal(user)}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
