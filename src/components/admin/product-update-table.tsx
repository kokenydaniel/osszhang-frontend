'use client';

import classNames from 'classnames';
import { Pencil, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/design/DataTable';
import { EmptyState } from '@/components/design/EmptyState';
import { StatusPill } from '@/components/design/StatusPill';
import { PRODUCT_UPDATE_KIND_LABELS } from '@/helpers/product-update-helpers';
import { formatDate } from '@/utils';
import config from '@/config/config';
import type { ProductUpdate } from '@/types/admin';

interface ProductUpdateTableProps {
  updates: ProductUpdate[];
  togglingId: number | null;
  deletingId: number | null;
  onToggle: (id: number) => void;
  onEdit: (update: ProductUpdate) => void;
  onDelete: (update: ProductUpdate) => void;
}

export function ProductUpdateTable({
  updates,
  togglingId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
}: ProductUpdateTableProps) {
  const columns: DataTableColumn<ProductUpdate>[] = [
    {
      key: 'title',
      header: 'Bejelentés',
      width: '34%',
      cell: (row) => (
        <div className="min-w-0 max-w-xl">
          <p className={classNames('text-sm font-medium', row.is_active ? 'text-foreground' : 'text-muted-foreground')}>
            {row.title}
          </p>
          {row.subtitle ? (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{row.subtitle}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'kind',
      header: 'Típus',
      cell: (row) => (
        <StatusPill status="info" size="xs">
          {PRODUCT_UPDATE_KIND_LABELS[row.kind]}
        </StatusPill>
      ),
    },
    {
      key: 'module',
      header: 'Modul',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.module_id
            ? config.modules.labels[row.module_id as keyof typeof config.modules.labels] ?? row.module_id
            : '—'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Prior.',
      align: 'center',
      cell: (row) => <span className="text-sm tabular-nums">{row.priority}</span>,
    },
    {
      key: 'created',
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
      data={updates}
      rowKey={(row) => String(row.id)}
      rowClassName={(row) =>
        row.is_active ? 'bg-primary/[0.06] ring-1 ring-inset ring-primary/15' : ''
      }
      minWidth="980px"
      empty={
        <EmptyState
          title="Még nincs újdonság bejelentés"
          description="Hozz létre egy bejelentést, majd aktiváld — a felhasználók belépéskor nagy modalt látnak."
        />
      }
    />
  );
}
