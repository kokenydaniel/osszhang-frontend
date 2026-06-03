'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ModalFormFooter } from '@/components/design';
import { Modal } from '@/components/ui/Modal';
import { getLastRentalApiFailure, rentalClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { rentalCalculations, type RentalIncomeFormValues } from '@/calculations/rental';
import { resolveRentalSettings } from '@/settings/rental';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRentalStore } from '@/stores/rentalStore';
import type { RentalIncomeEntry, RentalProperty } from '@/types/rental';
import { RentalIncomeForm } from './forms/rental-income-form';

type Props = {
  open: boolean;
  entry: RentalIncomeEntry | null;
  properties: RentalProperty[];
  selectedYear: number;
  selectedMonth: number;
  preselectedPropertyId?: number | null;
  onClose: () => void;
  onSaved: () => void;
};

export function RentalIncomeModal({
  open,
  entry,
  properties,
  selectedYear,
  selectedMonth,
  preselectedPropertyId,
  onClose,
  onSaved,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const settings = useMemo(() => resolveRentalSettings(user?.household), [user?.household]);
  const isEdit = entry !== null;
  const lastResetKey = useRef<string | null>(null);
  const activeProperties = useMemo(() => properties.filter((p) => p.isActive), [properties]);

  const form = useForm<RentalIncomeFormValues>({
    defaultValues: rentalCalculations.emptyIncomeValues(
      undefined,
      settings.default_currency,
      selectedYear,
      selectedMonth,
    ),
  });

  const formResetKey = entry
    ? String(entry.id)
    : `new-${preselectedPropertyId ?? ''}-${selectedYear}-${selectedMonth}`;

  useEffect(() => {
    if (!open) {
      lastResetKey.current = null;
      return;
    }
    if (lastResetKey.current === formResetKey) return;
    lastResetKey.current = formResetKey;

    if (entry) {
      form.reset(rentalCalculations.valuesFromIncome(entry));
      return;
    }

    const prop =
      activeProperties.find((p) => p.id === preselectedPropertyId) ?? activeProperties[0];
    form.reset(
      rentalCalculations.emptyIncomeValues(prop, settings.default_currency, selectedYear, selectedMonth),
    );
  }, [
    open,
    formResetKey,
    entry,
    form,
    activeProperties,
    preselectedPropertyId,
    settings.default_currency,
    selectedMonth,
    selectedYear,
  ]);

  const values = form.watch();
  const propertyId = values.rentalPropertyId;

  useEffect(() => {
    if (isEdit || !open) return;
    const prop = activeProperties.find((p) => String(p.id) === propertyId);
    if (!prop) return;
    const rent = String(prop.monthlyRent);
    const common = String(prop.monthlyCommonCost);
    const due = rentalCalculations.dueDateForProperty(prop, selectedYear, selectedMonth);
    form.setValue('rentAmount', rent, { shouldDirty: true });
    form.setValue('commonCostAmount', common, { shouldDirty: true });
    form.setValue('amount', String(prop.monthlyRent + prop.monthlyCommonCost), { shouldDirty: true });
    form.setValue('currency', prop.currency, { shouldDirty: true });
    form.setValue('dueDate', due, { shouldDirty: true });
  }, [propertyId, activeProperties, form, isEdit, open, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isEdit) return;
    const rent = Number(values.rentAmount) || 0;
    const common = Number(values.commonCostAmount) || 0;
    const total = String(rent + common);
    if (values.amount !== total) {
      form.setValue('amount', total, { shouldDirty: true });
    }
  }, [values.rentAmount, values.commonCostAmount, values.amount, form, isEdit]);

  const patchForm = (patch: Partial<RentalIncomeFormValues>) => {
    (Object.keys(patch) as (keyof RentalIncomeFormValues)[]).forEach((key) => {
      form.setValue(key, patch[key] as RentalIncomeFormValues[typeof key], { shouldDirty: true });
    });
  };

  const submit = form.handleSubmit(async (formValues) => {
    if (!Number(formValues.rentalPropertyId)) {
      form.setError('root', { message: 'Válassz ingatlant.' });
      return;
    }

    const payload = rentalCalculations.payloadFromIncome(formValues, selectedYear, selectedMonth);
    const res =
      isEdit && entry
        ? await rentalClient.updateIncome(entry.id, payload)
        : await rentalClient.createIncome(payload);

    if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
      form.setError('root', {
        message: getLastRentalApiFailure()?.message ?? 'A mentés nem sikerült.',
      });
      return;
    }

    useRentalStore.getState().upsertIncome(res[1]);
    onSaved();
    onClose();
  });

  const isSubmitting = form.formState.isSubmitting;
  const periodLabel = rentalCalculations.periodLabel(selectedMonth, selectedYear);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Bevétel szerkesztése' : 'Havi bevétel rögzítése'}
      description={periodLabel}
      dismissible={!isSubmitting}
    >
      <form onSubmit={submit} className="space-y-4">
        <RentalIncomeForm
          values={values}
          properties={properties}
          currencies={settings.currencies}
          periodLabel={periodLabel}
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
