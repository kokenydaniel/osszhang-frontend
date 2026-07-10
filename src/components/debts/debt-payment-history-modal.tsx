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
import { AlertCircle, History, Trash2 } from 'lucide-react';

function formatShortPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  const labels = [
    'jan.', 'feb.', 'márc.', 'ápr.', 'máj.', 'jún.',
    'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.',
  ];
  const idx = Number(month) - 1;
  return `${year}. ${labels[idx] ?? month}`;
}

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
        size="lg"
        animateContent={false}
      >
        {missed.length > 0 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 mb-4 text-foreground flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">
                Kihagyott hónapok (szinkron indulás óta)
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                {missed.map(formatInstallmentPeriodLabel).join(' · ')}
              </p>
            </div>
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
            <table className="w-full text-sm border-collapse min-w-[580px]">
              <thead>
                <tr className="text-left text-[0.65rem] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 px-2 font-medium w-24">Hónap</th>
                  <th className="py-2 px-2 font-medium w-24">Dátum</th>
                  <th className="py-2 px-2 font-medium text-right w-24">Összeg</th>
                  <th className="py-2 px-2 font-medium w-24">Forrás</th>
                  <th className="py-2 px-2 font-medium">Megjegyzés</th>
                  {canEdit ? <th className="py-2 px-2 font-medium w-10" /> : null}
                </tr>
              </thead>
              <tbody>
                {payments.map((row, index) => {
                  const key = paymentKey(row, index);
                  return (
                    <tr key={key} className="border-b border-border/60">
                      <td className="py-2.5 px-2 font-medium whitespace-nowrap">
                        {formatShortPeriodLabel(row.period)}
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground tabular-nums whitespace-nowrap">
                        {row.paidAt ? formatDate(row.paidAt) : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-medium whitespace-nowrap">
                        {formatHUF(row.amount)}
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground text-xs whitespace-nowrap">
                        {installmentPaymentSourceLabel(row.source)}
                      </td>
                      <td className="py-2.5 px-2 text-foreground text-xs break-words min-w-[120px]">
                        {row.note || '—'}
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
