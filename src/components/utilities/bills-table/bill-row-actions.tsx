'use client';

import { useNotificationStore } from '@/stores/useNotificationStore';
import { utilitiesClient } from '@/lib/api-client';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { StatusCodes } from '@/types/api';
import { RowActions } from '@/components/design';
import type { UtilityBill } from '@/types';

type BillRowActionsProps = {
  bill: UtilityBill;
  onEdit: (bill: UtilityBill) => void;
  onDeleted: () => void;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
};

export function BillRowActions({ bill, onEdit, onDeleted, requestDelete }: BillRowActionsProps) {
  const { addNotification } = useNotificationStore();

  return (
    <RowActions
      onEdit={() => onEdit(bill)}
      onDelete={() =>
        requestDelete({
          title: 'Rezsi tétel törlése',
          message: `Biztosan törlöd a „${bill.type}" számlát? Ez a művelet nem vonható vissza.`,
          onConfirm: async () => {
            try {
              const res = await utilitiesClient.delete(bill.id);
              if (
                !res ||
                (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)
              ) {
                throw new Error('API Error');
              }
              useUtilitiesStore.getState().removeBill(bill.id);
              addNotification('Rezsi tétel törölve.', 'success');
              onDeleted();
            } catch {
              addNotification('A törlés nem sikerült.', 'error');
            }
          },
        })
      }
    />
  );
}
