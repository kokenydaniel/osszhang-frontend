'use client';

import { User } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/design/DataTable';
import { EntityCell } from '@/components/design/EntityCell';
import { EmptyState } from '@/components/design/EmptyState';
import { StatusPill } from '@/components/design/StatusPill';
import { formatTierLabel, formatHouseholdRole } from '@/helpers/admin-helpers';
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
          subtitle={`${row.first_name} ${row.last_name}`.trim() || '—'}
          badge={
            row.lifetime_admin ? (
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
      cell: (row) => row.household_name ?? '—',
    },
    {
      key: 'role',
      header: 'Szerep',
      cell: (row) => formatHouseholdRole(row.role),
    },
    {
      key: 'tier',
      header: 'Hozzáférés',
      cell: (row) => {
        const billing = row.billing_tier ?? row.household_subscription_tier;
        const differs = billing !== row.effective_tier;
        return (
          <div className="flex flex-col gap-0.5 items-start">
            <StatusPill status={row.effective_tier === 'free' ? 'neutral' : 'info'} size="xs">
              {formatTierLabel(row.effective_tier)}
            </StatusPill>
            {differs ? (
              <span className="text-[0.65rem] text-muted-foreground">Fizet: {formatTierLabel(billing)}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Státusz',
      align: 'center',
      cell: (row) => (
        <StatusPill status={row.is_active ? 'success' : 'danger'} size="xs">
          {row.is_active ? 'Aktív' : 'Inaktív'}
        </StatusPill>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Utolsó belépés',
      align: 'right',
      cell: (row) => (row.last_login_at ? formatDate(row.last_login_at) : '—'),
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
