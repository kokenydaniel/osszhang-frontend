'use client';

import { User } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/design/DataTable';
import { EntityCell } from '@/components/design/EntityCell';
import { EmptyState } from '@/components/design/EmptyState';
import { StatusPill } from '@/components/design/StatusPill';
import { AdminService } from '@/services/AdminService';
import { formatDate } from '@/utils';
import type { AdminUser } from '@/types/admin';

interface AdminUserTableProps {
  users: AdminUser[];
  onRowClick: (user: AdminUser) => void;
}

export function AdminUserTable({ users, onRowClick }: AdminUserTableProps) {
  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'Felhasználó',
      cell: (row) => (
        <EntityCell
          icon={User}
          title={row.username}
          subtitle={`${row.firstName} ${row.lastName}`.trim() || '—'}
          badge={
            row.lifetimeAdmin ? (
              <StatusPill status="warning" size="xs">
                Platform admin
              </StatusPill>
            ) : null
          }
        />
      ),
    },
    {
      key: 'household',
      header: 'Háztartás',
      cell: (row) => row.householdName ?? '—',
    },
    {
      key: 'role',
      header: 'Szerep',
      cell: (row) => AdminService.formatHouseholdRole(row.role),
    },
    {
      key: 'tier',
      header: 'Háztartás csomag',
      cell: (row) => (
        <StatusPill status={row.effectiveTier === 'free' ? 'neutral' : 'info'} size="xs">
          {AdminService.formatTierLabel(row.effectiveTier)}
        </StatusPill>
      ),
    },
    {
      key: 'status',
      header: 'Státusz',
      align: 'center',
      cell: (row) => (
        <StatusPill status={row.isActive ? 'success' : 'danger'} size="xs">
          {row.isActive ? 'Aktív' : 'Inaktív'}
        </StatusPill>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Utolsó belépés',
      align: 'right',
      cell: (row) => (row.lastLoginAt ? formatDate(row.lastLoginAt) : '—'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      rowKey={(row) => row.id}
      onRowClick={onRowClick}
      minWidth="900px"
      empty={
        <EmptyState
          title="Nincs találat"
          description="Próbálj más keresési feltételt vagy szűrőt."
        />
      }
    />
  );
}
