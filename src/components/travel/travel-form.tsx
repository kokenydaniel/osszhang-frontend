'use client';

import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { AccentPanel } from '@/components/design';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { DatePicker } from '@/components/ui/DatePicker';
import { MiniSwitch } from '@/components/design';
import classNames from 'classnames';
import { HELP } from '@/config/help';
import type { TravelFormInput } from '@/hooks/useTravelPageData';
import {
  TRAVEL_ACCOMMODATION_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  TRAVEL_TRANSPORT_OPTIONS,
} from '@/calculations/travel';
import { Loader2, MapPinned, Sparkles } from 'lucide-react';

type TravelFormProps = {
  form: UseFormReturn<TravelFormInput>;
  isGenerating: boolean;
  onSubmit: ReturnType<UseFormReturn<TravelFormInput>['handleSubmit']>;
};

const selectClassName = classNames(
  'flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
);

function FormFieldPair({ left, right }: { left: ReactNode; right: ReactNode }) {
  return <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">{left}{right}</div>;
}

export function TravelForm({ form, isGenerating, onSubmit }: TravelFormProps) {
  const { register, control, watch } = form;
  const transportMode = watch('transportMode');
  const transportAlreadyBooked = watch('transportAlreadyBooked');
  const accommodationAlreadyBooked = watch('accommodationAlreadyBooked');
  const showCarFields = transportMode === 'car' || transportMode === 'mixed';

  return (
    <AccentPanel
      tone="ai"
      icon={MapPinned}
      title="Utazás paraméterei"
      description="Úti cél, közlekedés, család és költségkeret — reális, piaci árakon alapuló terv"
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <FieldLabel info={HELP.travel.destination}>Úti cél</FieldLabel>
          <Input
            {...register('destination', { required: true })}
            placeholder="pl. Róma, Split, Balaton"
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <FieldLabel info={HELP.travel.origin}>Indulás innen</FieldLabel>
          <Input
            {...register('originLocation', { required: true })}
            placeholder="Budapest"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel info={HELP.travel.duration}>Napok száma</FieldLabel>
          <Input
            type="number"
            min={1}
            max={90}
            {...register('durationDays', { required: true })}
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.travel.travelers}>Utazók száma</FieldLabel>
          <Input
            type="number"
            min={1}
            max={12}
            {...register('travelersCount', { required: true })}
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.travel.budget}>Költségkeret (Ft)</FieldLabel>
          <Input
            type="number"
            min={1000}
            step={1000}
            {...register('totalBudget', { required: true })}
            placeholder="500000"
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.travel.targetDate}>Tervezett indulás</FieldLabel>
          <Controller
            name="targetDate"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} disabled={isGenerating} />
            )}
          />
        </div>

        <FormFieldPair
          left={
            <div className="space-y-1.5">
              <FieldLabel info={HELP.travel.transportMode}>Közlekedés</FieldLabel>
              <Controller
                name="transportMode"
                control={control}
                render={({ field }) => (
                  <select {...field} disabled={isGenerating} className={selectClassName}>
                    {TRAVEL_TRANSPORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="text-xs text-muted-foreground min-h-[2.5rem] leading-relaxed">
                {TRAVEL_TRANSPORT_OPTIONS.find((o) => o.value === transportMode)?.hint}
              </p>
            </div>
          }
          right={
            <div className="space-y-1.5">
              <FieldLabel info={HELP.travel.transportBooked}>Közlekedés már lefoglalva</FieldLabel>
              <div className="flex h-10 items-center">
                <Controller
                  name="transportAlreadyBooked"
                  control={control}
                  render={({ field }) => (
                    <MiniSwitch
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isGenerating}
                      label={field.value ? 'Igen' : 'Nem'}
                    />
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground min-h-[2.5rem] leading-relaxed">
                {transportAlreadyBooked
                  ? 'Csak helyszíni költségek kerülnek a tervbe.'
                  : 'A közlekedés költsége is beleszámít.'}
              </p>
            </div>
          }
        />

        {showCarFields ? (
          <div className="space-y-1.5 md:col-span-2">
            <FieldLabel info={HELP.travel.carConsumption}>Autó fogyasztás (l/100 km)</FieldLabel>
            <Input
              type="number"
              min={3}
              max={25}
              step={0.1}
              {...register('carFuelConsumption', { required: showCarFields })}
              placeholder="7.0"
              disabled={isGenerating}
            />
          </div>
        ) : null}

        <div className="space-y-1.5 md:col-span-2">
          <FieldLabel info={HELP.travel.tripStyle}>Utazás stílusa</FieldLabel>
          <Controller
            name="tripStyle"
            control={control}
            render={({ field }) => (
              <select {...field} disabled={isGenerating} className={selectClassName}>
                {TRAVEL_STYLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <FormFieldPair
          left={
            <div className="space-y-1.5">
              <FieldLabel info={HELP.travel.accommodation}>Szállás</FieldLabel>
              <Controller
                name="accommodationPreference"
                control={control}
                render={({ field }) => (
                  <select {...field} disabled={isGenerating} className={selectClassName}>
                    {TRAVEL_ACCOMMODATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="text-xs text-muted-foreground min-h-[2.5rem] leading-relaxed">
                Hostel, apartman vagy hotel preferencia a költségbecsléshez.
              </p>
            </div>
          }
          right={
            <div className="space-y-1.5">
              <FieldLabel info={HELP.travel.accommodationBooked}>Szállás már lefoglalva</FieldLabel>
              <div className="flex h-10 items-center">
                <Controller
                  name="accommodationAlreadyBooked"
                  control={control}
                  render={({ field }) => (
                    <MiniSwitch
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isGenerating}
                      label={field.value ? 'Igen' : 'Nem'}
                    />
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground min-h-[2.5rem] leading-relaxed">
                {accommodationAlreadyBooked
                  ? 'A szállásköltség nem kerül a tervbe.'
                  : 'A szállás költsége is beleszámít.'}
              </p>
            </div>
          }
        />

        <div className="md:col-span-2 xl:col-span-4">
          <Button type="submit" disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? 'Generálás…' : 'AI utazástervezés indítása'}
          </Button>
        </div>
      </form>
    </AccentPanel>
  );
}
