'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/design';
import { rentalCalculations } from '@/calculations/rental';
import { formatDate } from '@/utils/dates';
import type { RentalExpense, RentalProperty } from '@/types/rental';
import type { useConfirmDelete } from '@/hooks/useConfirmDelete';

type Props = {
  expenses: RentalExpense[];
  properties: RentalProperty[];
  isReader: boolean;
  onEdit: (e: RentalExpense) => void;
  requestDelete: ReturnType<typeof useConfirmDelete>['requestDelete'];
  onDelete: (e: RentalExpense) => void | Promise<void>;
};

export function RentalExpensesTable({
  expenses,
  properties,
  isReader,
  onEdit,
  requestDelete,
  onDelete,
}: Props) {
  const columns: DataTableColumn<RentalExpense>[] = [
    {
      key: 'property',
      header: 'Ingatlan',
      cell: (e) => rentalCalculations.propertyById(properties, e.rentalPropertyId)?.name ?? '—',
    },
    {
      key: 'type',
      header: 'Típus',
      cell: (e) => rentalCalculations.expenseTypeLabel(e.expenseType),
    },
    {
      key: 'amount',
      header: 'Összeg',
      cell: (e) => rentalCalculations.formatMoney(e.amount, e.currency),
      className: 'tabular-nums font-medium',
    },
    {
      key: 'date',
      header: 'Dátum',
      cell: (e) => formatDate(e.expenseDate),
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
                title: 'Költség törlése',
                message: 'Biztosan törlöd ezt a tulajdonosi költséget?',
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

  if (expenses.length === 0) {
    return (
      <EmptyState
        title="Nincs tulajdonosi költség"
        description="Felújítás, karbantartás, társasházi közös költség (ha te fizeted) — külön a bérlő által fizetett díjtól."
      />
    );
  }

  return <DataTable columns={columns} data={expenses} rowKey={(e) => e.id} />;
}
