'use client';

import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { useAdminUsersPageData } from '@/hooks/useAdminUsersPageData';
import type { AdminLifetimeAdminFilter, AdminUser, AdminUserStatusFilter } from '@/types/admin';
import { AdminUsersToolbar } from './admin-users-toolbar';
import { AdminUserTable } from './admin-user-table';
import { AdminUserDetailDrawer } from './admin-user-detail-drawer';
import { AdminActivateModal } from './admin-activate-modal';
import { AdminDeactivateModal } from './admin-deactivate-modal';
import { AdminImpersonateModal } from './admin-impersonate-modal';

export function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminUserStatusFilter>('all');
  const [lifetimeAdminFilter, setLifetimeAdminFilter] = useState<AdminLifetimeAdminFilter>('all');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activateTarget, setActivateTarget] = useState<AdminUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<AdminUser | null>(null);

  const data = useAdminUsersPageData({ search, statusFilter, lifetimeAdminFilter, page });
  const drawerUser = data.resolveUser(selectedUser);

  const openUserDrawer = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  }, []);

  const closeUserDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedUser(null);
  }, []);

  const handleActivate = useCallback(async () => {
    if (!activateTarget) return;
    const updated = await data.activateUser(activateTarget);
    if (!updated) return;
    setActivateTarget(null);
    if (drawerOpen && selectedUser?.id === updated.id) {
      setSelectedUser(updated);
    }
  }, [activateTarget, data, drawerOpen, selectedUser?.id]);

  const handleDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    const updated = await data.deactivateUser(deactivateTarget);
    if (!updated) return;
    setDeactivateTarget(null);
    if (drawerOpen && selectedUser?.id === updated.id) {
      setSelectedUser(updated);
    }
  }, [data, deactivateTarget, drawerOpen, selectedUser?.id]);

  const handleImpersonate = useCallback(async () => {
    if (!impersonateTarget) return;
    const ok = await data.impersonateUser(impersonateTarget);
    if (!ok) return;
    setImpersonateTarget(null);
    closeUserDrawer();
  }, [closeUserDrawer, data, impersonateTarget]);

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
          <Button variant="outline" size="sm" onClick={() => void data.refreshUsers()} disabled={data.isRefreshing}>
            <RefreshCw size={14} className={data.isRefreshing ? 'animate-spin' : ''} />
            Frissítés
          </Button>
        }
        meta={
          data.meta ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {data.meta.total} felhasználó
            </span>
          ) : null
        }
      />

      <AdminUsersToolbar
        search={search}
        statusFilter={statusFilter}
        lifetimeAdminFilter={lifetimeAdminFilter}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onLifetimeAdminFilterChange={(value) => {
          setLifetimeAdminFilter(value);
          setPage(1);
        }}
      />

      {data.isLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <AdminUserTable users={data.users} onRowClick={openUserDrawer} />
      )}

      {data.meta && data.meta.last_page > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {data.meta.current_page}. / {data.meta.last_page} oldal
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.current_page <= 1}
              onClick={() => setPage(data.meta!.current_page - 1)}
            >
              <ChevronLeft size={14} />
              Előző
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.current_page >= data.meta.last_page}
              onClick={() => setPage(data.meta!.current_page + 1)}
            >
              Következő
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      ) : null}

      <AdminUserDetailDrawer
        open={drawerOpen}
        user={drawerUser}
        canManageUser={data.canManageUser}
        onClose={closeUserDrawer}
        onActivate={setActivateTarget}
        onDeactivate={setDeactivateTarget}
        onImpersonate={setImpersonateTarget}
      />
      <AdminActivateModal
        target={activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={() => void handleActivate()}
        loading={data.activating}
      />
      <AdminDeactivateModal
        target={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => void handleDeactivate()}
        loading={data.deactivating}
      />
      <AdminImpersonateModal
        target={impersonateTarget}
        onClose={() => setImpersonateTarget(null)}
        onConfirm={() => void handleImpersonate()}
        loading={data.impersonating}
      />
    </div>
  );
}
