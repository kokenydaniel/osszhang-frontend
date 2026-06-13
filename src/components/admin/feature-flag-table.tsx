'use client';

import { Switch } from '@/components/ui/switch';
import { DataTable, type DataTableColumn } from '@/components/design/DataTable';
import { EmptyState } from '@/components/design/EmptyState';
import { StatusPill } from '@/components/design/StatusPill';
import { formatFeatureFlagLabel } from '@/helpers/admin-helpers';
import { PLATFORM_FEATURE_CATEGORY_LABELS, platformFeatureCategory, platformFeatureScope } from '@/config/platform-features';
import type { FeatureFlag } from '@/types/admin';

interface FeatureFlagTableProps {
  flags: FeatureFlag[];
  togglingKey: string | null;
  onToggle: (key: string, value: boolean) => void;
  emptyDescription?: string;
  formatLabel?: (key: string) => string;
  categoryLabel?: (key: string) => string;
  scopeLabel?: (key: string) => string;
  showScope?: boolean;
  lockedKeys?: string[];
}

export function FeatureFlagTable({
  flags,
  togglingKey,
  onToggle,
  emptyDescription,
  formatLabel = formatFeatureFlagLabel,
  categoryLabel,
  scopeLabel,
  showScope = false,
  lockedKeys = [],
}: FeatureFlagTableProps) {
  const columns: DataTableColumn<FeatureFlag>[] = [
    {
      key: 'category',
      header: 'Csoport',
      width: showScope ? '10%' : '12%',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {categoryLabel
            ? categoryLabel(row.key)
            : PLATFORM_FEATURE_CATEGORY_LABELS[platformFeatureCategory(row.key)]}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Kapcsoló',
      cell: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-sm text-foreground">{formatLabel(row.key)}</div>
          <div className="text-xs text-muted-foreground mt-0.5 font-mono">{row.key}</div>
        </div>
      ),
    },
    ...(showScope
      ? [
          {
            key: 'scope',
            header: 'Mit érint',
            width: '18%',
            cell: (row: FeatureFlag) => (
              <p className="text-xs text-foreground/85 leading-relaxed">
                {scopeLabel ? scopeLabel(row.key) : platformFeatureScope(row.key)}
              </p>
            ),
          } satisfies DataTableColumn<FeatureFlag>,
        ]
      : []),
    {
      key: 'description',
      header: 'Leírás',
      cell: (row) => (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl whitespace-pre-wrap">
          {row.description ?? '—'}
        </p>
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
          disabled={togglingKey === row.key || lockedKeys.includes(row.key)}
          onCheckedChange={(checked) => onToggle(row.key, checked)}
          aria-label={formatLabel(row.key)}
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
          description={emptyDescription ?? 'A globális feature flag-ek még nem lettek konfigurálva.'}
        />
      }
    />
  );
}
