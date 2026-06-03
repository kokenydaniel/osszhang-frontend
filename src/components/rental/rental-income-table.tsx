'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/design';
import { rentalCalculations } from '@/calculations/rental';
import { formatDate } from '@/utils/dates';
import type { RentalIncomeEntry, RentalProperty } from '@/types/rental';
import type { useConfirmDelete } from '@/hooks/useConfirmDelete';

type Props = {
  entries: RentalIncomeEntry[];
  properties: RentalProperty[];
  isReader: boolean;
  onEdit: (e: RentalIncomeEntry) => void;
  requestDelete: ReturnType<typeof useConfirmDelete>['requestDelete'];
  onDelete: (e: RentalIncomeEntry) => void | Promise<void>;
};

export function RentalIncomeTable({
  entries,
  properties,
  isReader,
  onEdit,
  requestDelete,
  onDelete,
}: Props) {
  const columns: DataTableColumn<RentalIncomeEntry>[] = [
    {
      key: 'property',
      header: 'Ingatlan',
      cell: (e) => rentalCalculations.propertyById(properties, e.rentalPropertyId)?.name ?? '—',
    },
    {
      key: 'amount',
      header: 'Összeg',
      cell: (e) => rentalCalculations.formatMoney(e.amount, e.currency),
      className: 'tabular-nums font-medium',
    },
    {
      key: 'due',
      header: 'Esedékes',
      cell: (e) => (e.dueDate ? formatDate(e.dueDate) : '—'),
    },
    {
      key: 'paid',
      header: 'Befizetés',
      cell: (e) => {
        const property = rentalCalculations.propertyById(properties, e.rentalPropertyId);
        const expected =
          (property?.monthlyRent ?? 0) + (property?.monthlyCommonCost ?? 0);
        const isPartial = !!e.paidDate && expected > 0 && e.amount + 0.005 < expected;
        if (isPartial) {
          return (
            <span className="text-amber-700">
              Részben ({formatDate(e.paidDate!)})
            </span>
          );
        }
        return e.paidDate ? (
          <span className="text-emerald-700">{formatDate(e.paidDate)}</span>
        ) : (
          <span className="text-amber-700">Várakozik</span>
        );
      },
    },
    {
      key: 'note',
      header: 'Megjegyzés',
      cell: (e) => e.note ?? '—',
    },
  ];

  if (!isReader) {
    columns.push({
      key: 'actions',
      header: '',
      cell: (e) => (
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="xs" onClick={() => onEdit(e)}>
            <Pencil size={12} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-destructive"
            onClick={() =>
              requestDelete({
                title: 'Bevétel törlése',
                message: 'Biztosan törlöd ezt a havi bevétel tételt?',
                onConfirm: () => onDelete(e),
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

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nincs bevétel ebben a hónapban"
        description="Rögzítsd a bérleti díj befizetését — akár részben vagy később is."
      />
    );
  }

  return <DataTable columns={columns} data={entries} rowKey={(e) => e.id} />;
}
