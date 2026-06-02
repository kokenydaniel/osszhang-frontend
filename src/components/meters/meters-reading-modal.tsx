'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleOptionCard } from '@/components/ui/toggle-option-card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/config/help';
import { today } from '@/utils/dates';
import { Replace, ClipboardCheck } from 'lucide-react';
import type { Meter, MeterReading } from '@/types';

type ReadingFormValues = {
  meterId: number;
  date: string;
  value: string;
  isReset: boolean;
  isOfficial: boolean;
};

export type MetersReadingModalTarget =
  | null
  | { mode: 'create'; meter: Meter }
  | { mode: 'edit'; meter: Meter; reading: MeterReading };

type MetersReadingModalProps = {
  open: boolean;
  target: MetersReadingModalTarget;
  meters: Meter[];
  onClose: () => void;
  onSave: (
    meterId: number,
    values: Omit<ReadingFormValues, 'meterId'>,
    editingReadingId: number | null,
  ) => Promise<void>;
};

export function MetersReadingModal({ open, target, meters, onClose, onSave }: MetersReadingModalProps) {
  const isEdit = target?.mode === 'edit';

  const form = useForm<ReadingFormValues>({
    defaultValues: {
      meterId: 0,
      date: today(),
      value: '',
      isReset: false,
      isOfficial: false,
    },
  });

  const { register, watch, setValue, handleSubmit, reset, formState } = form;
  const isReset = watch('isReset');
  const isOfficial = watch('isOfficial');

  useEffect(() => {
    if (!open || !target) return;
    if (target.mode === 'edit') {
      reset({
        meterId: target.meter.id,
        date: target.reading.date,
        value: String(target.reading.value),
        isReset: target.reading.is_reset ?? false,
        isOfficial: target.reading.is_official ?? false,
      });
    } else {
      reset({
        meterId: target.meter.id,
        date: today(),
        value: '',
        isReset: false,
        isOfficial: false,
      });
    }
  }, [open, target, reset]);

  const submit = handleSubmit(async (values) => {
    if (!values.meterId) return;
    try {
      await onSave(
        values.meterId,
        {
          date: values.date,
          value: values.value,
          isReset: values.isReset,
          isOfficial: values.isOfficial,
        },
        isEdit && target?.mode === 'edit' ? target.reading.id : null,
      );
      onClose();
    } catch {
      form.setError('root', { message: 'A leolvasás mentése nem sikerült.' });
    }
  });

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Leolvasás szerkesztése' : 'Mérőóra rögzítése'}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {formState.errors.root?.message ? (
          <p className="text-sm text-destructive">{formState.errors.root.message}</p>
        ) : null}

        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.meterSelect}>Melyik mérőóra?</FieldLabel>
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
            {...register('meterId', { valueAsNumber: true, required: true })}
            disabled={isEdit}
          >
            <option value={0} disabled>
              Válassz mérőórát…
            </option>
            {meters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.location})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.readingDate}>Dátum</FieldLabel>
          <DatePicker value={watch('date')} onChange={(v) => setValue('date', v)} />
        </div>

        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.readingValue}>Mérőóra állás</FieldLabel>
          <Input type="number" {...register('value', { required: true })} />
        </div>

        <div className="flex flex-col gap-2.5">
          <ToggleOptionCard
            checked={isReset}
            onCheckedChange={(v) => setValue('isReset', v)}
            icon={Replace}
            title="Óracsere történt"
            description="Új mérő került felszerelésre; a fogyasztás ettől a ponttól újraszámolódik."
            iconClassName="bg-rose-500/15 text-rose-600 dark:text-rose-400"
            activeClassName="border-rose-500/25 ring-rose-500/10"
          />
          <ToggleOptionCard
            checked={isOfficial}
            onCheckedChange={(v) => setValue('isOfficial', v)}
            icon={ClipboardCheck}
            title="Szolgáltató leolvasta"
            description="A szolgáltató kint járt és helyszínen leolvasta az órát — nem saját rögzítés."
            iconClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            activeClassName="border-emerald-500/25 ring-emerald-500/10"
          />
        </div>

        <Button type="submit" className="mt-1 w-full" loading={formState.isSubmitting}>
          Mentés
        </Button>
      </form>
    </Modal>
  );
}
