'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ModalFormFooter } from '@/components/design';
import { Modal } from '@/components/ui/Modal';
import { getLastInsuranceApiFailure, insuranceClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { insuranceCalculations } from '@/calculations/insurance';
import { resolveInsuranceSettings } from '@/settings/insurance';
import { useAuthStore } from '@/stores/useAuthStore';
import { useInsuranceStore } from '@/stores/insuranceStore';
import type { InsurancePolicy, InsurancePolicyFormValues } from '@/types/insurance';
import { InsurancePolicyForm } from './insurance-policy-form';

type InsurancePolicyModalProps = {
  open: boolean;
  policy: InsurancePolicy | null;
  onClose: () => void;
  onSaved: (policy: InsurancePolicy, mode: 'create' | 'update') => void;
};

export function InsurancePolicyModal({ open, policy, onClose, onSaved }: InsurancePolicyModalProps) {
  const user = useAuthStore((s) => s.user);
  const settings = useMemo(() => resolveInsuranceSettings(user?.household), [user?.household]);
  const categories = user?.household?.categories?.length
    ? user.household.categories
    : ['Biztosítás', 'Rezsi'];
  const isEdit = policy !== null;
  const lastResetKey = useRef<string | null>(null);

  const form = useForm<InsurancePolicyFormValues>({
    defaultValues: insuranceCalculations.emptyFormValues(
      settings.default_currency,
      settings.budget_sync_default,
    ),
  });

  const formResetKey = policy ? String(policy.id) : 'new';

  useEffect(() => {
    if (!open) {
      lastResetKey.current = null;
      return;
    }
    if (lastResetKey.current === formResetKey) return;
    lastResetKey.current = formResetKey;
    form.reset(
      policy
        ? insuranceCalculations.valuesFromPolicy(policy)
        : insuranceCalculations.emptyFormValues(
            settings.default_currency,
            settings.budget_sync_default,
          ),
    );
  }, [open, formResetKey, policy, form, settings.default_currency, settings.budget_sync_default]);

  const values = form.watch();

  const patchForm = (patch: Partial<InsurancePolicyFormValues>) => {
    (Object.keys(patch) as (keyof InsurancePolicyFormValues)[]).forEach((key) => {
      form.setValue(key, patch[key] as InsurancePolicyFormValues[typeof key], { shouldDirty: true });
    });
  };

  const submit = form.handleSubmit(async (formValues) => {
    if (!formValues.name.trim()) return;
    const payload = insuranceCalculations.payloadFromForm(formValues);
    const res = isEdit && policy
      ? await insuranceClient.update(policy.id, payload)
      : await insuranceClient.create(payload);

    if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
      const failure = getLastInsuranceApiFailure();
      form.setError('root', {
        message: failure?.message ?? 'A szerződés mentése nem sikerült.',
      });
      return;
    }
    const saved = res[1] as InsurancePolicy;
    useInsuranceStore.getState().upsertPolicy(saved);
    onSaved(saved, isEdit ? 'update' : 'create');
    onClose();
  });

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Szerződés szerkesztése' : 'Új biztosítás'}
      size="lg"
      animateContent={false}
      dismissible={!form.formState.isSubmitting}
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-5">
        {form.formState.errors.root?.message ? (
          <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <InsurancePolicyForm
          values={values}
          currencies={settings.currencies}
          categories={categories}
          onChange={patchForm}
        />

        <p className="text-xs text-muted-foreground">
          {isEdit
            ? 'PDF dokumentumok (kötvény, ajánlat) a kártyán vagy a lista „Dokumentum” oszlopából érhetők el — nem kell a szerkesztőt megnyitni.'
            : 'PDF dokumentumok a mentés után a kártyán vagy a lista „Dokumentum” oszlopából tölthetők fel.'}
        </p>

        <ModalFormFooter
          onCancel={onClose}
          submitLabel={isEdit ? 'Mentés' : 'Létrehozás'}
          loading={form.formState.isSubmitting}
        />
      </form>
    </Modal>
  );
}
