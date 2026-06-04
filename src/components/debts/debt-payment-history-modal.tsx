'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/design';
import { Button } from '@/components/ui/button';
import { formatHUF, formatDate } from '@/utils';
import { debtsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useDebtsStore } from '@/stores/debtsStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import {
  buildDebtRemoveInstallmentPaymentUpdate,
  formatInstallmentPeriodLabel,
  installmentPaymentSourceLabel,
  listMissedInstallmentPeriods,
  resolveInstallmentPayments,
} from '@/helpers/debt-installment-payments';
import type { Debt, DebtInstallmentPayment } from '@/types/debts';
import { History, Trash2 } from 'lucide-react';

type DebtPaymentHistoryModalProps = {
  open: boolean;
  debt: Debt | null;
  selectedYear: number;
  selectedMonth: number;
  canEdit?: boolean;
  onClose: () => void;
  onDebtUpdated?: (debt: Debt) => void;
};

export function DebtPaymentHistoryModal({
  open,
  debt,
  selectedYear,
  selectedMonth,
  canEdit = false,
  onClose,
  onDebtUpdated,
}: DebtPaymentHistoryModalProps) {
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const payments = useMemo(
    () => (debt ? resolveInstallmentPayments(debt) : []),
    [debt],
  );

  const missed = useMemo(
    () => (debt ? listMissedInstallmentPeriods(debt, selectedYear, selectedMonth) : []),
    [debt, selectedMonth, selectedYear],
  );

  const paymentKey = (row: DebtInstallmentPayment, index: number) =>
    `${row.period}-${row.paidAt ?? ''}-${row.amount}-${row.source}-${index}`;

  const handleDelete = (row: DebtInstallmentPayment, index: number) => {
    if (!debt || !canEdit) return;
    requestDelete({
      title: 'Befizetés törlése',
      message: `Biztosan törlöd a ${formatInstallmentPeriodLabel(row.period)} havi befizetést (${formatHUF(row.amount)})? A visszafizetett összeg is csökken.`,
      onConfirm: async () => {
        const payload = buildDebtRemoveInstallmentPaymentUpdate(debt, row);
        if (!payload) {
          addNotification('A befizetés nem található.', 'error');
          return;
        }
        const key = paymentKey(row, index);
        setDeletingKey(key);
        try {
          const res = await debtsClient.update(debt.id, payload);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error();
          useDebtsStore.getState().patchDebt(debt.id, res[1]);
          onDebtUpdated?.(res[1]);
          addNotification('Befizetés törölve.', 'success');
        } catch {
          addNotification('A befizetés törlése nem sikerült.', 'error');
        } finally {
          setDeletingKey(null);
        }
      },
    });
  };

  if (!debt) return null;

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title="Befizetési előzmények"
        description={debt.name}
        size="md"
        animateContent={false}
      >
        {missed.length > 0 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 mb-4">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              Kihagyott hónapok (szinkron indulás óta)
            </p>
            <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1 leading-relaxed">
              {missed.map(formatInstallmentPeriodLabel).join(' · ')}
            </p>
          </div>
        ) : null}

        {payments.length === 0 ? (
          <EmptyState
            icon={History}
            title="Még nincs rögzített befizetés"
            description="A költségvetésben kifizetett havi részletek és a Tartozások „Befizetés” gombja itt jelenik meg."
          />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm border-collapse min-w-[520px]">
              <thead>
                <tr className="text-left text-[0.65rem] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 px-2 font-medium">Törlesztési hónap</th>
                  <th className="py-2 px-2 font-medium">Befizetve</th>
                  <th className="py-2 px-2 font-medium text-right">Összeg</th>
                  <th className="py-2 px-2 font-medium">Forrás</th>
                  {canEdit ? <th className="py-2 px-2 font-medium w-10" /> : null}
                </tr>
              </thead>
              <tbody>
                {payments.map((row, index) => {
                  const key = paymentKey(row, index);
                  return (
                    <tr key={key} className="border-b border-border/60">
                      <td className="py-2.5 px-2 font-medium">
                        {formatInstallmentPeriodLabel(row.period)}
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground tabular-nums">
                        {row.paidAt ? formatDate(row.paidAt) : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-medium">
                        {formatHUF(row.amount)}
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground text-xs">
                        {installmentPaymentSourceLabel(row.source)}
                      </td>
                      {canEdit ? (
                        <td className="py-2.5 px-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={deletingKey === key}
                            onClick={() => handleDelete(row, index)}
                            title="Befizetés törlése"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
      <ConfirmDeleteModal />
    </>
  );
}
