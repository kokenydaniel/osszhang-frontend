'use client';

import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleOptionCard } from '@/components/ui/toggle-option-card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { Replace, ClipboardCheck } from 'lucide-react';
import type { Meter, MeterReading } from '@/types';

interface MetersReadingFormProps {
  editingReading: { meter: Meter; reading: MeterReading } | null;
  meters: Meter[];
  meterId: number;
  onMeterIdChange: (id: number) => void;
  date: string;
  onDateChange: (date: string) => void;
  value: string;
  onValueChange: (value: string) => void;
  isReset: boolean;
  onIsResetChange: (value: boolean) => void;
  isOfficial: boolean;
  onIsOfficialChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function MetersReadingForm({
  editingReading,
  meters,
  meterId,
  onMeterIdChange,
  date,
  onDateChange,
  value,
  onValueChange,
  isReset,
  onIsResetChange,
  isOfficial,
  onIsOfficialChange,
  onSubmit,
}: MetersReadingFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <FieldLabel info={HELP.meters.meterSelect}>Melyik mérőóra?</FieldLabel>
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
          value={meterId}
          onChange={(e) => onMeterIdChange(Number(e.target.value))}
          disabled={!!editingReading}
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
        <DatePicker value={date} onChange={onDateChange} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel info={HELP.meters.readingValue}>Mérőóra állás</FieldLabel>
        <Input type="number" value={value} onChange={(e) => onValueChange(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-2.5">
        <ToggleOptionCard
          checked={isReset}
          onCheckedChange={onIsResetChange}
          icon={Replace}
          title="Óracsere történt"
          description="Új mérő került felszerelésre; a fogyasztás ettől a ponttól újraszámolódik."
          iconClassName="bg-rose-500/15 text-rose-600 dark:text-rose-400"
          activeClassName="border-rose-500/25 ring-rose-500/10"
        />
        <ToggleOptionCard
          checked={isOfficial}
          onCheckedChange={onIsOfficialChange}
          icon={ClipboardCheck}
          title="Szolgáltató leolvasta"
          description="A szolgáltató kint járt és helyszínen leolvasta az órát — nem saját rögzítés."
          iconClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          activeClassName="border-emerald-500/25 ring-emerald-500/10"
        />
      </div>
      <Button type="submit" className="mt-1">
        Mentés
      </Button>
    </form>
  );
}
