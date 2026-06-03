'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ModalFormFooter } from '@/components/design';
import { Modal } from '@/components/ui/Modal';
import { getLastRentalApiFailure, rentalClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { rentalCalculations, type RentalPropertyFormValues } from '@/calculations/rental';
import { resolveRentalSettings } from '@/settings/rental';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRentalStore } from '@/stores/rentalStore';
import { canEditHousehold } from '@/utils/household-role';
import type { RentalProperty } from '@/types/rental';
import { RentalPropertyForm } from './forms/rental-property-form';
import { RentalPropertyAttachments } from './rental-property-attachments';

type Props = {
  open: boolean;
  property: RentalProperty | null;
  onClose: () => void;
  onSaved: (mode: 'create' | 'update') => void;
};

export function RentalPropertyModal({ open, property, onClose, onSaved }: Props) {
  const user = useAuthStore((s) => s.user);
  const settings = useMemo(() => resolveRentalSettings(user?.household), [user?.household]);
  const isEdit = property !== null;
  const canEdit = canEditHousehold(user);
  const lastResetKey = useRef<string | null>(null);

  const form = useForm<RentalPropertyFormValues>({
    defaultValues: rentalCalculations.emptyPropertyValues(
      settings.default_currency,
      settings.budget_sync_default,
    ),
  });

  const formResetKey = property ? String(property.id) : 'new';

  useEffect(() => {
    if (!open) {
      lastResetKey.current = null;
      return;
    }
    if (lastResetKey.current === formResetKey) return;
    lastResetKey.current = formResetKey;
    form.reset(
      property
        ? rentalCalculations.valuesFromProperty(property)
        : rentalCalculations.emptyPropertyValues(
            settings.default_currency,
            settings.budget_sync_default,
          ),
    );
  }, [open, formResetKey, property, form, settings.default_currency, settings.budget_sync_default]);

  const values = form.watch();

  const patchForm = (patch: Partial<RentalPropertyFormValues>) => {
    (Object.keys(patch) as (keyof RentalPropertyFormValues)[]).forEach((key) => {
      form.setValue(key, patch[key] as RentalPropertyFormValues[typeof key], { shouldDirty: true });
    });
  };

  const handleAttachmentCountChange = useCallback(
    (count: number) => {
      if (!property) return;
      useRentalStore.getState().upsertProperty({ ...property, attachmentCount: count });
    },
    [property],
  );

  const submit = form.handleSubmit(async (formValues) => {
    if (!formValues.name.trim()) {
      form.setError('root', { message: 'Az ingatlan neve kötelező.' });
      return;
    }
    const payload = rentalCalculations.payloadFromProperty(formValues);
    const res =
      isEdit && property
        ? await rentalClient.updateProperty(property.id, payload)
        : await rentalClient.createProperty(payload);

    if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
      form.setError('root', {
        message: getLastRentalApiFailure()?.message ?? 'A mentés nem sikerült.',
      });
      return;
    }

    useRentalStore.getState().upsertProperty(res[1]);
    onSaved(isEdit ? 'update' : 'create');
    onClose();
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Ingatlan szerkesztése' : 'Új ingatlan'}
      dismissible={!isSubmitting}
    >
      <form onSubmit={submit} className="space-y-4">
        <RentalPropertyForm values={values} currencies={settings.currencies} onChange={patchForm} />
        {isEdit && property ? (
          <RentalPropertyAttachments
            propertyId={property.id}
            canEdit={canEdit}
            onCountChange={handleAttachmentCountChange}
          />
        ) : null}
        {form.formState.errors.root?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}
        <ModalFormFooter
          onCancel={onClose}
          submitLabel={isEdit ? 'Mentés' : 'Létrehozás'}
          loading={isSubmitting}
        />
      </form>
    </Modal>
  );
}
