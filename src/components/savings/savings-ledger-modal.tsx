'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/config/help';
import { today } from '@/utils/dates';
import { SegmentedControl, LedgerHistoryPanel } from '@/components/design';
import { Plus, Trash2, Pencil, Edit3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { LedgerEntry, SavingsAccount } from '@/types';

type LedgerFormValues = {
  ledgerType: 'deposit' | 'withdraw';
  ledgerAmount: string;
  ledgerReason: string;
  ledgerDate: string;
};

type SavingsLedgerModalProps = {
  open: boolean;
  account: SavingsAccount | null;
  isReader: boolean;
  formatCurrencyAmount: (amount: number, currency: string) => string;
  onClose: () => void;
  onSave: (
    savingsId: number,
    entry: { date: string; amount: number; reason: string },
    editingLedgerId: number | null,
  ) => Promise<void>;
  onDeleteEntry: (savingsId: number, entryId: number) => Promise<void>;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
};

export function SavingsLedgerModal({
  open,
  account,
  isReader,
  formatCurrencyAmount,
  onClose,
  onSave,
  onDeleteEntry,
  requestDelete,
}: SavingsLedgerModalProps) {
  const [editingLedgerId, setEditingLedgerId] = useState<number | null>(null);

  const form = useForm<LedgerFormValues>({
    defaultValues: {
      ledgerType: 'deposit',
      ledgerAmount: '',
      ledgerReason: '',
      ledgerDate: today(),
    },
  });

  const { register, watch, setValue, handleSubmit, reset, formState } = form;
  const ledgerType = watch('ledgerType');
  const ledgerAmount = watch('ledgerAmount');
  const ledgerReason = watch('ledgerReason');

  useEffect(() => {
    if (!open) return;
    setEditingLedgerId(null);
    reset({
      ledgerType: 'deposit',
      ledgerAmount: '',
      ledgerReason: '',
      ledgerDate: today(),
    });
  }, [open, account?.id, reset]);

  const startEditLedger = (item: LedgerEntry) => {
    setEditingLedgerId(item.id);
    reset({
      ledgerAmount: String(Math.abs(item.amount)),
      ledgerType: item.amount >= 0 ? 'deposit' : 'withdraw',
      ledgerReason: item.reason,
      ledgerDate: item.date,
    });
  };

  const clearForm = () => {
    setEditingLedgerId(null);
    reset({
      ledgerType: 'deposit',
      ledgerAmount: '',
      ledgerReason: '',
      ledgerDate: today(),
    });
  };

  const submit = handleSubmit(async (values) => {
    if (!account) return;
    const cleanAmount = values.ledgerAmount.replace(',', '.');
    const amt =
      values.ledgerType === 'deposit' ? Number(cleanAmount) : -Number(cleanAmount);
    await onSave(
      account.id,
      { date: values.ledgerDate, amount: amt, reason: values.ledgerReason },
      editingLedgerId,
    );
    clearForm();
  });

  if (!account) return null;

  const ledgerCurrency = account.currency;
  const ledgerItems = account.ledger ?? [];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Számla történet"
      description={
        isReader
          ? 'Korábbi mozgások megtekintése.'
          : editingLedgerId
            ? 'Tétel szerkesztése — módosítsd az adatokat, majd mentsd.'
            : 'Új mozgás rögzítése vagy korábbi tétel javítása.'
      }
      contentKey={`${ledgerType}-${editingLedgerId ?? 'new'}`}
    >
      <div className="flex flex-col gap-4">
        {!isReader ? (
          <>
            <SegmentedControl
              variant="choice"
              value={ledgerType}
              onChange={(v) => setValue('ledgerType', v as 'deposit' | 'withdraw')}
              options={[
                {
                  value: 'deposit',
                  label: 'Befizetés',
                  icon: ArrowUpRight,
                  tone: 'positive',
                  description: 'Növeli az egyenleget',
                },
                {
                  value: 'withdraw',
                  label: 'Kivétel',
                  icon: ArrowDownRight,
                  tone: 'negative',
                  description: 'Csökkenti az egyenleget',
                },
              ]}
              animated={false}
            />
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.historyAmount}>Összeg</FieldLabel>
              <Input type="number" placeholder="0" step="any" {...register('ledgerAmount', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.historyNote}>Megjegyzés</FieldLabel>
              <Input placeholder="pl. Utalás a közösbe" {...register('ledgerReason', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Dátum</FieldLabel>
              <DatePicker value={watch('ledgerDate')} onChange={(v) => setValue('ledgerDate', v)} />
            </div>
            <div className="flex gap-2">
              {editingLedgerId ? (
                <Button type="button" variant="outline" className="flex-1" onClick={clearForm}>
                  Mégse
                </Button>
              ) : null}
              <Button
                type="button"
                className="flex-1"
                disabled={
                  !ledgerAmount.trim() ||
                  !ledgerReason.trim() ||
                  formState.isSubmitting
                }
                loading={formState.isSubmitting}
                onClick={() => void submit()}
              >
                {editingLedgerId ? (
                  <>
                    <Pencil size={13} /> Mentés
                  </>
                ) : (
                  <>
                    <Plus size={13} /> Rögzítés
                  </>
                )}
              </Button>
            </div>
          </>
        ) : null}

        <LedgerHistoryPanel
          items={ledgerItems}
          editingId={editingLedgerId}
          formatAmount={(amount) => formatCurrencyAmount(amount, ledgerCurrency)}
          actions={
            isReader
              ? undefined
              : (item) => (
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
                          title: 'Tétel törlése',
                          message: `Biztosan törlöd a „${item.reason}" tételt (${formatCurrencyAmount(item.amount, ledgerCurrency)})?`,
                          onConfirm: () => {
                            void onDeleteEntry(account.id, item.id);
                            if (editingLedgerId === item.id) clearForm();
                          },
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </Button>
                  </>
                )
          }
        />
      </div>
    </Modal>
  );
}
