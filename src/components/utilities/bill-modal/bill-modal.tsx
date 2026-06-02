'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { utilitiesClient } from '@/lib/api-client';
import { utilitiesCalculations } from '@/calculations/utilities';
import { useAuthStore } from '@/stores/useAuthStore';
import { today } from '@/utils/dates';
import { StatusCodes } from '@/types/api';
import type { UtilityBill, UtilitySplitRule } from '@/types';

interface BillFormValues {
  type: string;
  total: number;
  dueDate: string;
  splitRule: UtilitySplitRule;
}

type UtilitiesBillModalProps = {
  open: boolean;
  editingBill: UtilityBill | null;
  onClose: () => void;
  onSaved: (bill: UtilityBill) => void;
};

export function UtilitiesBillModal({ open, editingBill, onClose, onSaved }: UtilitiesBillModalProps) {
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const utilitySplitEnabled = user?.household?.utility_split_enabled ?? false;
  const utilityLabels = utilitiesCalculations.resolveSplitLabels(user);
  const settlementOptions = utilitiesCalculations.buildSettlementOptions(
    utilityLabels.onHouseholdSide,
    utilityLabels.partnerSideLabel,
    utilityLabels.householdSideLabel,
  );

  const form = useForm<BillFormValues>({
    defaultValues: {
      type: '',
      total: 0,
      dueDate: today(),
      splitRule: 'shared',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      type: editingBill?.type ?? '',
      total: editingBill?.total ?? 0,
      dueDate: editingBill?.dueDate ?? today(),
      splitRule: editingBill?.splitRule ?? 'shared',
    });
  }, [open, editingBill, form]);

  const onSubmit = async (formData: BillFormValues) => {
    setSaving(true);
    const payload = utilitiesCalculations.buildBillFormPayload(
      {
        type: formData.type,
        total: String(formData.total),
        dueDate: formData.dueDate,
        splitRule: formData.splitRule,
      },
      utilitySplitEnabled,
    );

    try {
      if (editingBill) {
        const res = await utilitiesClient.update(editingBill.id, payload as Parameters<typeof utilitiesClient.update>[1]);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
        addNotification('Rezsi tétel frissítve.', 'success');
        onSaved(res[1]);
      } else {
        const res = await utilitiesClient.create(payload as Parameters<typeof utilitiesClient.create>[0]);
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
          throw new Error('API Error');
        }
        addNotification('Rezsi tétel rögzítve.', 'success');
        onSaved(res[1]);
      }
    } catch {
      addNotification('A mentés nem sikerült. Próbáld újra.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editingBill ? 'Tétel szerkesztése' : 'Új rezsi tétel'}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Típus">
          <Input placeholder="Pl. Villany, Gáz, Víz" {...form.register('type', { required: true })} />
        </FormField>

        <FormField label="Összeg (Ft)">
          <Input
            type="number"
            placeholder="0"
            {...form.register('total', { required: true, valueAsNumber: true })}
          />
        </FormField>

        <FormField label="Határidő">
          <Controller
            control={form.control}
            name="dueDate"
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Válassz határidőt" />
            )}
          />
        </FormField>

        {utilitySplitEnabled ? (
          <FormField label="Megosztás módja">
            <select
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
              {...form.register('splitRule')}
            >
              {settlementOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.title}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Mégse
          </Button>
          <Button type="submit" loading={saving}>
            {editingBill ? 'Mentés' : 'Rögzítés'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
