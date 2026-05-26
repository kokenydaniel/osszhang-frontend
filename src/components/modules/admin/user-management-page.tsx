'use client';

import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { AdminUsersToolbar } from '@/components/modules/admin/admin-users-toolbar';
import { AdminUserTable } from '@/components/modules/admin/admin-user-table';
import { AdminUserDetailDrawer } from '@/components/modules/admin/admin-user-detail-drawer';
import { AdminActivateModal } from '@/components/modules/admin/admin-activate-modal';
import { AdminDeactivateModal } from '@/components/modules/admin/admin-deactivate-modal';
import { AdminImpersonateModal } from '@/components/modules/admin/admin-impersonate-modal';
import { useAdminUi } from '@/components/modules/admin/AdminUiContext';
import { useAdminLogic } from '@/components/modules/admin/hooks/useAdminLogic';

export function UserManagementPage() {
  const ui = useAdminUi();
  const {
    users,
    meta,
    isLoading,
    isRefreshing,
    selectedUser,
    activating,
    deactivating,
    impersonating,
    refreshUsers,
    handleActivate,
    handleDeactivate,
    handleImpersonate,
    canManageUser,
  } = useAdminLogic();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/users' },
          { label: 'Felhasználók' },
        ]}
        title="Platform admin / Felhasználók"
        description="Platform szintű felhasználók listázása, aktiválása, inaktiválása és megszemélyesítése."
        actions={
          <Button variant="outline" size="sm" onClick={() => void refreshUsers()} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Frissítés
          </Button>
        }
        meta={
          meta ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {meta.total} felhasználó
            </span>
          ) : null
        }
      />

      <AdminUsersToolbar />

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <AdminUserTable users={users} onRowClick={ui.openUserDrawer} />
      )}

      {meta && meta.lastPage > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {meta.currentPage}. / {meta.lastPage} oldal
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.currentPage <= 1}
              onClick={() => ui.setPage(meta.currentPage - 1)}
            >
              <ChevronLeft size={14} />
              Előző
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.currentPage >= meta.lastPage}
              onClick={() => ui.setPage(meta.currentPage + 1)}
            >
              Következő
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      ) : null}

      <AdminUserDetailDrawer user={selectedUser} canManageUser={canManageUser} />
      <AdminActivateModal onConfirm={() => void handleActivate()} loading={activating} />
      <AdminDeactivateModal onConfirm={() => void handleDeactivate()} loading={deactivating} />
      <AdminImpersonateModal onConfirm={() => void handleImpersonate()} loading={impersonating} />
    </div>
  );
}
