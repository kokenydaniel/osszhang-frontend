'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ModalFormFooter } from '@/components/design';
import { Modal } from '@/components/ui/Modal';
import { pocketMoneyClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import {
  pocketMoneyCalculations,
  type PocketMoneyFormValues,
} from '@/calculations/pocket-money';
import type { PocketMoneyEntry } from '@/types/pocket-money';
import { mergeRosterWithEntryMembers, resolvePocketMoneySettings } from '@/settings/pocket-money';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePocketMoneyStore } from '@/stores/pocketMoneyStore';
import { PocketMoneyEntryForm } from './pocket-money-entry-form';

type PocketMoneyEntryModalProps = {
  open: boolean;
  entry: PocketMoneyEntry | null;
  defaultDate: string;
  preselectedRosterMemberId?: string | null;
  onClose: () => void;
  onSaved: (entry: PocketMoneyEntry, mode: 'create' | 'update') => void;
  onAddMember?: () => void;
};

export function PocketMoneyEntryModal({
  open,
  entry,
  defaultDate,
  preselectedRosterMemberId,
  onClose,
  onSaved,
  onAddMember,
}: PocketMoneyEntryModalProps) {
  const user = useAuthStore((s) => s.user);
  const entries = usePocketMoneyStore((s) => s.entries);
  const settings = useMemo(() => resolvePocketMoneySettings(user?.household), [user?.household]);
  const roster = useMemo(
    () => mergeRosterWithEntryMembers(settings.members, entries),
    [settings.members, entries],
  );
  const isEdit = entry !== null;
  const lastResetKey = useRef<string | null>(null);

  const form = useForm<PocketMoneyFormValues>({
    defaultValues: pocketMoneyCalculations.emptyFormValues(settings.default_currency, defaultDate),
  });

  const formResetKey = entry ? String(entry.id) : `new-${preselectedRosterMemberId ?? ''}-${defaultDate}`;

  useEffect(() => {
    if (!open) {
      lastResetKey.current = null;
      return;
    }
    if (lastResetKey.current === formResetKey) return;
    lastResetKey.current = formResetKey;

    let values = entry
      ? pocketMoneyCalculations.valuesFromEntry(entry, roster)
      : pocketMoneyCalculations.emptyFormValues(settings.default_currency, defaultDate);

    if (!entry && preselectedRosterMemberId) {
      const member = roster.find((m) => m.id === preselectedRosterMemberId);
      if (member) values = pocketMoneyCalculations.applyRosterMemberToForm(values, member);
    }

    form.reset(values);
  }, [open, formResetKey, entry, defaultDate, preselectedRosterMemberId, roster, form, settings.default_currency]);

  const patchForm = (patch: Partial<PocketMoneyFormValues>) => {
    (Object.keys(patch) as (keyof PocketMoneyFormValues)[]).forEach((key) => {
      form.setValue(key, patch[key] as PocketMoneyFormValues[typeof key], { shouldDirty: true });
    });
  };

  const submit = form.handleSubmit(async (values) => {
    if (!values.rosterMemberId) {
      form.setError('root', { message: 'Válassz gyereket a listából.' });
      return;
    }
    const payload = pocketMoneyCalculations.buildPayload({
      ...values,
      currency: settings.default_currency,
    });

    if (isEdit && entry) {
      const res = await pocketMoneyClient.update(entry.id, payload);
      if (!res || res[0] !== StatusCodes.Http200) {
        form.setError('root', { message: 'A mentés nem sikerült.' });
        return;
      }
      onSaved(res[1], 'update');
      onClose();
      return;
    }

    const res = await pocketMoneyClient.create(payload);
    if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
      form.setError('root', { message: 'A mentés nem sikerült.' });
      return;
    }
    onSaved(res[1], 'create');
    onClose();
  });

  const watched = form.watch();

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Tétel szerkesztése' : 'Új zsebpénz tétel'}
      description="Válaszd ki a gyereket, a típust és az összeget forintban."
      animateContent={false}
      contentKey={watched.entryType}
    >
      <form onSubmit={submit} className="space-y-4">
        <PocketMoneyEntryForm
          values={watched}
          onPatch={patchForm}
          onSelectMember={(member) =>
            patchForm(pocketMoneyCalculations.applyRosterMemberToForm(form.getValues(), member))
          }
          roster={roster}
          defaultCurrency={settings.default_currency}
          rootError={form.formState.errors.root?.message}
          onAddMember={onAddMember}
        />
        <ModalFormFooter
          onCancel={onClose}
          submitType="submit"
          loading={form.formState.isSubmitting}
          submitLabel={isEdit ? 'Mentés' : 'Hozzáadás'}
        />
      </form>
    </Modal>
  );
}
