'use client';

import { Switch } from '@/components/ui/switch';
import { DataTable, type DataTableColumn } from '@/components/design/DataTable';
import { EmptyState } from '@/components/design/EmptyState';
import { StatusPill } from '@/components/design/StatusPill';
import { formatFeatureFlagLabel } from '@/helpers/admin-helpers';
import type { FeatureFlag } from '@/types/admin';

interface FeatureFlagTableProps {
  flags: FeatureFlag[];
  togglingKey: string | null;
  onToggle: (key: string, value: boolean) => void;
}

export function FeatureFlagTable({ flags, togglingKey, onToggle }: FeatureFlagTableProps) {
  const columns: DataTableColumn<FeatureFlag>[] = [
    {
      key: 'name',
      header: 'Funkció',
      cell: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-sm text-foreground">{formatFeatureFlagLabel(row.key)}</div>
          <div className="text-xs text-muted-foreground mt-0.5 font-mono">{row.key}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Leírás',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.description ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Állapot',
      align: 'center',
      cell: (row) => (
        <StatusPill status={row.value ? 'success' : 'neutral'} size="xs">
          {row.value ? 'Bekapcsolva' : 'Kikapcsolva'}
        </StatusPill>
      ),
    },
    {
      key: 'toggle',
      header: 'Kapcsoló',
      align: 'right',
      cell: (row) => (
        <Switch
          checked={row.value}
          disabled={togglingKey === row.key}
          onCheckedChange={(checked) => onToggle(row.key, checked)}
          aria-label={formatFeatureFlagLabel(row.key)}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={flags}
      rowKey={(row) => row.key}
      minWidth="760px"
      empty={
        <EmptyState
          title="Nincs rendszer funkció"
          description="A globális feature flag-ek még nem lettek konfigurálva."
        />
      }
    />
  );
}
