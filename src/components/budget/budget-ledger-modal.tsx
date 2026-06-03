'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { LedgerHistoryPanel } from '@/components/design';
import { LedgerEntryAttachments } from '@/components/attachments/ledger-entry-attachments';
import { HELP } from '@/config/help';
import { today as todayDate } from '@/utils/dates';
import { Check, Edit3, Pencil, Plus, Trash2 } from 'lucide-react';
import { budgetClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { isSavingsGoalTransaction, type CashTransaction, type LedgerEntry } from '@/types';
import { syncSavingsForWallet } from '@/helpers/wallet-data-sync';
import type { ConfirmDeleteOptions } from '@/hooks/useConfirmDelete';

export type BudgetLedgerModalTarget = {
  txId: number | string;
  isGoal: boolean;
  goalTitle: string;
  defaultAmount: string;
  defaultReason: string;
};

type BudgetLedgerFormValues = {
  ledgerAmount: string;
  ledgerReason: string;
  ledgerDate: string;
};

type BudgetLedgerModalProps = {
  open: boolean;
  target: BudgetLedgerModalTarget | null;
  ledgerItems: LedgerEntry[] | undefined;
  selectedYear: number;
  selectedMonth: number;
  activeWalletId: number | null;
  onClose: () => void;
  onSaved: (updated: CashTransaction, isGoal: boolean) => void;
  requestDelete: (options: ConfirmDeleteOptions) => void;
};

export function BudgetLedgerModal({
  open,
  target,
  ledgerItems,
  selectedYear,
  selectedMonth,
  activeWalletId,
  onClose,
  onSaved,
  requestDelete,
}: BudgetLedgerModalProps) {
  const isGoal = target?.isGoal ?? false;
  const [editingLedgerId, setEditingLedgerId] = useState<number | null>(null);

  const form = useForm<BudgetLedgerFormValues>({
    defaultValues: { ledgerAmount: '', ledgerReason: '', ledgerDate: todayDate() },
  });

  const { register, handleSubmit, reset, control, formState } = form;
  const ledgerAmount = form.watch('ledgerAmount');

  useEffect(() => {
    if (!open || !target) return;
    setEditingLedgerId(null);
    reset({
      ledgerAmount: target.defaultAmount,
      ledgerReason: target.defaultReason,
      ledgerDate: todayDate(),
    });
  }, [open, target, reset]);

  const clearForm = () => {
    if (!target) return;
    setEditingLedgerId(null);
    reset({
      ledgerAmount: target.defaultAmount,
      ledgerReason: target.defaultReason,
      ledgerDate: todayDate(),
    });
  };

  const startEditLedger = (item: LedgerEntry) => {
    setEditingLedgerId(item.id);
    reset({
      ledgerAmount: String(Math.abs(item.amount)),
      ledgerReason: item.reason,
      ledgerDate: item.date,
    });
  };

  const submit = handleSubmit(async (values) => {
    if (!target) return;

    const cleanAmount = values.ledgerAmount.replace(',', '.');
    const amtNum = Number(cleanAmount);
    if (!amtNum || amtNum <= 0) {
      form.setError('ledgerAmount', { message: 'Az összeg legalább 1 Ft kell legyen.' });
      return;
    }

    const isGoalPayment = target.isGoal || isSavingsGoalTransaction({ id: target.txId });
    const monthDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const amt = isGoalPayment ? Math.abs(amtNum) : -Math.abs(amtNum);
    const entryDate = isGoalPayment ? monthDate : values.ledgerDate;
    const reason = values.ledgerReason || (isGoalPayment ? 'Költségvetés – havi befizetés' : '');

    const res =
      editingLedgerId !== null && !isGoalPayment
        ? await budgetClient.updateItem(target.txId, editingLedgerId, {
            date: entryDate,
            amount: amt,
            reason,
          })
        : await budgetClient.addItem(target.txId, {
            date: entryDate,
            amount: amt,
            reason,
          });

    if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
      form.setError('root', { message: 'A rögzítés nem sikerült.' });
      return;
    }

    if (isGoalPayment && activeWalletId !== null) {
      void syncSavingsForWallet(activeWalletId);
    }

    onSaved(res[1], isGoalPayment);
    if (isGoalPayment) {
      onClose();
    } else {
      clearForm();
    }
  });

  const deleteLedgerEntry = async (item: LedgerEntry) => {
    if (!target || isGoal) return;
    const res = await budgetClient.deleteItem(target.txId, item.id);
    if (!res || res[0] !== StatusCodes.Http200) {
      form.setError('root', { message: 'A törlés nem sikerült.' });
      return;
    }
    onSaved(res[1], false);
    if (editingLedgerId === item.id) clearForm();
  };

  if (!target) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isGoal ? `Befizetés: ${target.goalTitle}` : 'Költés rögzítése (ledger)'}
      description={
        isGoal
          ? 'A tervezett havi összeg előre kitöltve — ellenőrizd, majd mentsd a befizetést.'
          : HELP.budget.ledgerModalIntro
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {formState.errors.root?.message ? (
          <p className="text-sm text-destructive">{formState.errors.root.message}</p>
        ) : null}

        <div className="space-y-1.5">
          <FieldLabel
            info={HELP.budget.ledgerAmount}
            hint={
              isGoal
                ? 'A hónapra tervezett megtakarítási összeg — módosíthatod, ha más összeget fizetsz be.'
                : 'Egy konkrét vásárlás / költés összege — összeadódik a „felhasználva” sávban.'
            }
          >
            {isGoal ? 'Befizetés összege' : 'Összeg (felhasznált)'}
          </FieldLabel>
          <Input type="number" placeholder="0" step="any" {...register('ledgerAmount', { required: true })} />
          {formState.errors.ledgerAmount ? (
            <p className="text-xs text-destructive">{formState.errors.ledgerAmount.message}</p>
          ) : null}
        </div>

        {!isGoal ? (
          <div className="space-y-1.5">
            <FieldLabel info={HELP.budget.date} hint="Mikor történt a költés.">
              Dátum
            </FieldLabel>
            <Controller
              control={control}
              name="ledgerDate"
              rules={{ required: true }}
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Válassz dátumot" />
              )}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <FieldLabel
            info={HELP.budget.ledgerNote}
            hint={isGoal ? 'Automatikusan kitöltve a cél nevével.' : 'pl. „Aldi 12.450 Ft” — később visszakereshető.'}
          >
            Megjegyzés
          </FieldLabel>
          <Input
            placeholder={isGoal ? 'Költségvetés – cél neve' : 'pl. Heti bevásárlás'}
            {...register('ledgerReason')}
          />
        </div>

        <Button
          type="submit"
          loading={formState.isSubmitting}
          disabled={
            formState.isSubmitting ||
            !ledgerAmount.trim() ||
            Number(ledgerAmount.replace(',', '.')) <= 0
          }
        >
          {isGoal ? (
            <>
              <Check size={13} /> Mentés
            </>
          ) : editingLedgerId ? (
            <>
              <Pencil size={13} /> Mentés
            </>
          ) : (
            <>
              <Plus size={13} /> Rögzítés
            </>
          )}
        </Button>

        {!isGoal ? (
          <LedgerHistoryPanel
            items={ledgerItems}
            editingId={editingLedgerId}
            actions={(item) => (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Szerkesztés"
                  onClick={() => startEditLedger(item)}
                >
                  <Edit3 size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Törlés"
                  onClick={() =>
                    requestDelete({
                      title: 'Ledger tétel törlése',
                      message: `Biztosan törlöd a „${item.reason}" tételt?`,
                      onConfirm: () => deleteLedgerEntry(item),
                    })
                  }
                >
                  <Trash2 size={13} />
                </Button>
              </>
            )}
            rowFooter={(item) => <LedgerEntryAttachments ledgerEntryId={item.id} compact />}
          />
        ) : (
          <LedgerHistoryPanel items={ledgerItems} />
        )}
      </form>
    </Modal>
  );
}
