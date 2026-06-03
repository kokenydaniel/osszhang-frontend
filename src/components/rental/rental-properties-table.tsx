'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/design';
import { rentalCalculations } from '@/calculations/rental';
import { formatDate } from '@/utils/dates';
import type { RentalProperty } from '@/types/rental';
import type { useConfirmDelete } from '@/hooks/useConfirmDelete';

type Props = {
  properties: RentalProperty[];
  isReader: boolean;
  onEdit: (p: RentalProperty) => void;
  requestDelete: ReturnType<typeof useConfirmDelete>['requestDelete'];
  onDelete: (p: RentalProperty) => void | Promise<void>;
};

export function RentalPropertiesTable({ properties, isReader, onEdit, requestDelete, onDelete }: Props) {
  const columns: DataTableColumn<RentalProperty>[] = [
    {
      key: 'name',
      header: 'Ingatlan',
      cell: (p) => (
        <div>
          <div className="font-medium text-foreground">{p.name}</div>
          {p.address ? <div className="text-xs text-muted-foreground">{p.address}</div> : null}
        </div>
      ),
    },
    {
      key: 'tenant',
      header: 'Bérlő',
      cell: (p) => p.tenantName ?? '—',
    },
    {
      key: 'rent',
      header: 'Havi díj',
      cell: (p) => rentalCalculations.formatMoney(p.monthlyRent, p.currency),
      className: 'tabular-nums',
    },
    {
      key: 'dueDay',
      header: 'Esedékesség',
      cell: (p) => (p.isActive ? `${p.dueDay ?? 5}. nap` : '—'),
    },
    {
      key: 'common',
      header: 'Közös ktg.',
      cell: (p) =>
        p.monthlyCommonCost > 0
          ? rentalCalculations.formatMoney(p.monthlyCommonCost, p.currency)
          : '—',
      className: 'tabular-nums',
    },
    {
      key: 'contract',
      header: 'Szerződés vége',
      cell: (p) => (p.contractEndsAt ? formatDate(p.contractEndsAt) : '—'),
    },
    {
      key: 'status',
      header: 'Státusz',
      cell: (p) => (
        <span className={p.isActive ? 'text-emerald-700' : 'text-muted-foreground'}>
          {p.isActive ? 'Aktív' : 'Inaktív'}
        </span>
      ),
    },
  ];

  if (!isReader) {
    columns.push({
      key: 'actions',
      header: '',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="xs" onClick={() => onEdit(p)}>
            <Pencil size={12} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-destructive"
            onClick={() =>
              requestDelete({
                title: 'Ingatlan törlése',
                message: `Biztosan törlöd: „${p.name}"? A hozzá tartozó bevételek is törlődnek.`,
                onConfirm: () => onDelete(p),
              })
            }
          >
            <Trash2 size={12} />
          </Button>
        </div>
      ),
      className: 'w-24',
    });
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        title="Még nincs ingatlan"
        description="Add hozzá az első bérbe adott ingatlant a fenti gombbal."
      />
    );
  }

  return <DataTable columns={columns} data={properties} rowKey={(p) => p.id} />;
}
