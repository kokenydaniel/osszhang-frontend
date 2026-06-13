'use client';

import { Home } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/design/DataTable';
import { EntityCell } from '@/components/design/EntityCell';
import { EmptyState } from '@/components/design/EmptyState';
import { StatusPill } from '@/components/design/StatusPill';
import { describeHouseholdAccess, formatTierLabel } from '@/helpers/admin-helpers';
import { formatDate } from '@/utils';
import type { AdminHousehold } from '@/types/admin';

interface AdminHouseholdTableProps {
  households: AdminHousehold[];
  onRowClick: (household: AdminHousehold) => void;
}

function tierTone(tier: string): 'neutral' | 'info' | 'success' {
  if (tier === 'premium') return 'success';
  if (tier === 'pro') return 'info';
  return 'neutral';
}

export function AdminHouseholdTable({ households, onRowClick }: AdminHouseholdTableProps) {
  const columns: DataTableColumn<AdminHousehold>[] = [
    {
      key: 'household',
      header: 'Háztartás',
      width: '28%',
      cell: (row) => (
        <EntityCell
          icon={Home}
          title={row.name}
          subtitle={row.business_name?.trim() || undefined}
        />
      ),
    },
    {
      key: 'members',
      header: 'Tagok',
      align: 'center',
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {row.active_members_count ?? row.members_count}/{row.members_count}
        </span>
      ),
    },
    {
      key: 'tier',
      header: 'Hozzáférés',
      width: '32%',
      cell: (row) => {
        const access = describeHouseholdAccess(row);
        return (
          <div className="flex flex-col gap-1 items-start max-w-[280px]">
            <StatusPill status={tierTone(access.effectiveTier)} size="xs">
              {formatTierLabel(access.effectiveTier)}
            </StatusPill>
            <p className="text-[0.72rem] text-muted-foreground leading-snug">{access.subline}</p>
          </div>
        );
      },
    },
    {
      key: 'created',
      header: 'Létrehozva',
      align: 'right',
      cell: (row) => (row.created_at ? formatDate(row.created_at) : '—'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={households}
      rowKey={(row) => row.id}
      onRowClick={onRowClick}
      minWidth="820px"
      empty={
        <EmptyState
          title="Nincs találat"
          description="Próbálj más keresési feltételt vagy szűrőt."
        />
      }
    />
  );
}
