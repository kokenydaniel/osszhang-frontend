'use client';

import { Switch } from '@/components/ui/switch';
import { DataTable, type DataTableColumn } from '@/components/design/DataTable';
import { EmptyState } from '@/components/design/EmptyState';
import { StatusPill } from '@/components/design/StatusPill';
import { formatAnnouncementTypeLabel } from '@/mappers/announcements.mapper';
import { formatDate } from '@/utils';
import type { SystemAnnouncement } from '@/types/admin';

interface AnnouncementTableProps {
  announcements: SystemAnnouncement[];
  togglingId: number | null;
  onToggle: (id: number) => void;
}

export function AnnouncementTable({ announcements, togglingId, onToggle }: AnnouncementTableProps) {
  const columns: DataTableColumn<SystemAnnouncement>[] = [
    {
      key: 'message',
      header: 'Üzenet',
      cell: (row) => (
        <div className="min-w-0 max-w-xl">
          <p className="text-sm text-foreground whitespace-pre-wrap">{row.message}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Típus',
      cell: (row) => (
        <StatusPill
          status={row.type === 'danger' ? 'danger' : row.type === 'warning' ? 'warning' : 'info'}
          size="xs"
        >
          {formatAnnouncementTypeLabel(row.type)}
        </StatusPill>
      ),
    },
    {
      key: 'createdAt',
      header: 'Létrehozva',
      cell: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.createdAt ? formatDate(row.createdAt) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Állapot',
      align: 'center',
      cell: (row) => (
        <StatusPill status={row.isActive ? 'success' : 'neutral'} size="xs">
          {row.isActive ? 'Aktív' : 'Inaktív'}
        </StatusPill>
      ),
    },
    {
      key: 'toggle',
      header: 'Közzététel',
      align: 'right',
      cell: (row) => (
        <Switch
          checked={row.isActive}
          disabled={togglingId === row.id}
          onCheckedChange={() => onToggle(row.id)}
          aria-label={row.isActive ? 'Kikapcsolás' : 'Aktiválás'}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={announcements}
      rowKey={(row) => String(row.id)}
      minWidth="860px"
      empty={
        <EmptyState
          title="Még nincs rendszerüzenet"
          description="Hozz létre egy új üzenetet, majd aktiváld a globális közzétételhez."
        />
      }
    />
  );
}
