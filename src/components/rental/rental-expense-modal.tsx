'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ModalFormFooter } from '@/components/design';
import { Modal } from '@/components/ui/Modal';
import { getLastRentalApiFailure, rentalClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { rentalCalculations, type RentalExpenseFormValues } from '@/calculations/rental';
import { resolveRentalSettings } from '@/settings/rental';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRentalStore } from '@/stores/rentalStore';
import type { RentalExpense, RentalProperty } from '@/types/rental';
import { RentalExpenseForm } from './forms/rental-expense-form';

type Props = {
  open: boolean;
  expense: RentalExpense | null;
  properties: RentalProperty[];
  onClose: () => void;
  onSaved: () => void;
};

export function RentalExpenseModal({ open, expense, properties, onClose, onSaved }: Props) {
  const user = useAuthStore((s) => s.user);
  const settings = useMemo(() => resolveRentalSettings(user?.household), [user?.household]);
  const isEdit = expense !== null;
  const lastResetKey = useRef<string | null>(null);

  const form = useForm<RentalExpenseFormValues>({
    defaultValues: rentalCalculations.emptyExpenseValues(undefined, settings.default_currency),
  });

  const formResetKey = expense ? String(expense.id) : 'new';

  useEffect(() => {
    if (!open) {
      lastResetKey.current = null;
      return;
    }
    if (lastResetKey.current === formResetKey) return;
    lastResetKey.current = formResetKey;
    form.reset(
      expense
        ? rentalCalculations.valuesFromExpense(expense)
        : rentalCalculations.emptyExpenseValues(properties[0], settings.default_currency),
    );
  }, [open, formResetKey, expense, form, properties, settings.default_currency]);

  const values = form.watch();

  const patchForm = (patch: Partial<RentalExpenseFormValues>) => {
    (Object.keys(patch) as (keyof RentalExpenseFormValues)[]).forEach((key) => {
      form.setValue(key, patch[key] as RentalExpenseFormValues[typeof key], { shouldDirty: true });
    });
  };

  const submit = form.handleSubmit(async (formValues) => {
    if (!Number(formValues.rentalPropertyId)) {
      form.setError('root', { message: 'Válassz ingatlant.' });
      return;
    }
    const payload = rentalCalculations.payloadFromExpense(formValues);
    const res =
      isEdit && expense
        ? await rentalClient.updateExpense(expense.id, payload)
        : await rentalClient.createExpense(payload);

    if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
      form.setError('root', {
        message: getLastRentalApiFailure()?.message ?? 'A mentés nem sikerült.',
      });
      return;
    }

    useRentalStore.getState().upsertExpense(res[1]);
    onSaved();
    onClose();
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Költség szerkesztése' : 'Tulajdonosi költség'}
      dismissible={!isSubmitting}
    >
      <form onSubmit={submit} className="space-y-4">
        <RentalExpenseForm
          values={values}
          properties={properties}
          currencies={settings.currencies}
          isEdit={isEdit}
          onChange={patchForm}
        />
        {form.formState.errors.root?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}
        <ModalFormFooter
          onCancel={onClose}
          submitLabel={isEdit ? 'Mentés' : 'Rögzítés'}
          loading={isSubmitting}
        />
      </form>
    </Modal>
  );
}
