'use client';

import classNames from 'classnames';
import { Pencil, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/design/DataTable';
import { EmptyState } from '@/components/design/EmptyState';
import { StatusPill } from '@/components/design/StatusPill';
import { formatAnnouncementTypeLabel } from '@/helpers/admin-helpers';
import { formatDate } from '@/utils';
import type { SystemAnnouncement } from '@/types/admin';

interface AnnouncementTableProps {
  announcements: SystemAnnouncement[];
  togglingId: number | null;
  deletingId: number | null;
  onToggle: (id: number) => void;
  onEdit: (announcement: SystemAnnouncement) => void;
  onDelete: (announcement: SystemAnnouncement) => void;
}

export function AnnouncementTable({
  announcements,
  togglingId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
}: AnnouncementTableProps) {
  const columns: DataTableColumn<SystemAnnouncement>[] = [
    {
      key: 'message',
      header: 'Üzenet',
      cell: (row) => (
        <div className="min-w-0 max-w-xl">
          <p
            className={classNames(
              'text-sm whitespace-pre-wrap',
              row.is_active ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {row.message}
          </p>
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
          {row.created_at ? formatDate(row.created_at) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Állapot',
      align: 'center',
      cell: (row) => (
        <StatusPill status={row.is_active ? 'success' : 'neutral'} size="xs">
          {row.is_active ? 'Aktív' : 'Inaktív'}
        </StatusPill>
      ),
    },
    {
      key: 'toggle',
      header: 'Közzététel',
      align: 'center',
      cell: (row) => (
        <Switch
          checked={row.is_active}
          disabled={togglingId === row.id}
          onCheckedChange={() => onToggle(row.id)}
          aria-label={row.is_active ? 'Kikapcsolás' : 'Aktiválás'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row)} aria-label="Szerkesztés">
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            loading={deletingId === row.id}
            onClick={() => onDelete(row)}
            aria-label="Törlés"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={announcements}
      rowKey={(row) => String(row.id)}
      rowClassName={(row) =>
        row.is_active ? 'bg-primary/[0.06] ring-1 ring-inset ring-primary/15' : ''
      }
      minWidth="920px"
      empty={
        <EmptyState
          title="Még nincs rendszerüzenet"
          description="Hozz létre egy új üzenetet, majd aktiváld a globális közzétételhez."
        />
      }
    />
  );
}
