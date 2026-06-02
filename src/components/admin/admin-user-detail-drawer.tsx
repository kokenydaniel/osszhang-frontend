'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { AdminUserDetailPanel } from './admin-user-detail-panel';
import type { AdminUser } from '@/types/admin';

type AdminUserDetailDrawerProps = {
  open: boolean;
  user: AdminUser | null;
  canManageUser: (user: AdminUser) => boolean;
  onClose: () => void;
  onActivate: (user: AdminUser) => void;
  onDeactivate: (user: AdminUser) => void;
  onImpersonate: (user: AdminUser) => void;
  onEditTierGrant: (user: AdminUser) => void;
};

export function AdminUserDetailDrawer({
  open,
  user,
  canManageUser,
  onClose,
  onActivate,
  onDeactivate,
  onImpersonate,
  onEditTierGrant,
}: AdminUserDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
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
              onActivate={() => onActivate(user)}
              onDeactivate={() => onDeactivate(user)}
              onImpersonate={() => onImpersonate(user)}
              onEditTierGrant={() => onEditTierGrant(user)}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
