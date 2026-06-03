'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/config/help';
import { metersCalculations } from '@/calculations/meters';
import type { MetersSettings, MeterTemplate } from '@/settings/meters';

type NewMeterFormValues = {
  name: string;
  unit: string;
  location: string;
};

type MetersNewMeterModalProps = {
  open: boolean;
  metersSettings: MetersSettings;
  onClose: () => void;
  onCreate: (values: NewMeterFormValues) => Promise<void>;
};

export function MetersNewMeterModal({ open, metersSettings, onClose, onCreate }: MetersNewMeterModalProps) {
  const form = useForm<NewMeterFormValues>({
    defaultValues: {
      name: '',
      unit: metersSettings.units[0] ?? 'kWh',
      location: metersSettings.default_location ?? '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: '',
      unit: metersSettings.units[0] ?? 'kWh',
      location: metersSettings.default_location ?? '',
    });
  }, [open, metersSettings, form]);

  const applyTemplate = (template: MeterTemplate) => {
    form.setValue('name', template.name);
    form.setValue('unit', template.unit);
    form.setValue('location', template.location ?? metersSettings.default_location ?? '');
  };

  const locationOptions = metersCalculations.locationOptionsFromGroups(
    metersSettings.location_groups,
    metersSettings.default_location,
  );

  const submit = form.handleSubmit(async (values) => {
    try {
      await onCreate(values);
      onClose();
    } catch {
      form.setError('root', { message: 'A mérőóra mentése nem sikerült.' });
    }
  });

  const { register, formState } = form;

  return (
    <Modal isOpen={open} onClose={onClose} title="Új mérőóra hozzáadása">
      <form onSubmit={submit} className="flex flex-col gap-4">
        {formState.errors.root?.message ? (
          <p className="text-sm text-destructive">{formState.errors.root.message}</p>
        ) : null}

        {metersSettings.templates.length > 0 ? (
          <div className="space-y-2">
            <FieldLabel info="Sablonok a Beállítások → Modulok → Közműórák alól">Gyors sablon</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {metersSettings.templates.map((template) => (
                <Button
                  key={`${template.name}-${template.unit}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.newMeterName}>Megnevezés</FieldLabel>
          <Input placeholder="pl. Villanyóra, Vízóra (Nappali)" {...register('name', { required: true })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.newMeterUnit}>Mértékegység</FieldLabel>
            <select
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
              {...register('unit')}
            >
              {metersSettings.units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.newMeterLocation}>Helyszín</FieldLabel>
            {locationOptions.length > 1 ? (
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                {...register('location', { required: true })}
              >
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            ) : (
              <Input {...register('location', { required: true })} />
            )}
          </div>
        </div>

        <Button type="submit" className="mt-1 w-full" loading={formState.isSubmitting}>
          Mérőóra létrehozása
        </Button>
      </form>
    </Modal>
  );
}
