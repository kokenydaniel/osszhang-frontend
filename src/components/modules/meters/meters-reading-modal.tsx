'use client';

import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleOptionCard } from '@/components/ui/toggle-option-card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { Replace, ClipboardCheck } from 'lucide-react';
import type { MetersPageState } from '@/components/modules/meters/hooks/use-meters-page-state';

type MetersReadingModalProps = Pick<
  MetersPageState,
  | 'isModalOpen'
  | 'setIsModalOpen'
  | 'editingReading'
  | 'meters'
  | 'meterId'
  | 'setMeterId'
  | 'date'
  | 'setDate'
  | 'value'
  | 'setValue'
  | 'isReset'
  | 'setIsReset'
  | 'isOfficial'
  | 'setIsOfficial'
  | 'handleSubmit'
>;

export function MetersReadingModal({
  isModalOpen,
  setIsModalOpen,
  editingReading,
  meters,
  meterId,
  setMeterId,
  date,
  setDate,
  value,
  setValue,
  isReset,
  setIsReset,
  isOfficial,
  setIsOfficial,
  handleSubmit,
}: MetersReadingModalProps) {
  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingReading ? 'Leolvasás szerkesztése' : 'Mérőóra rögzítése'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.meterSelect}>Melyik mérőóra?</FieldLabel>
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
            value={meterId}
            onChange={(e) => setMeterId(Number(e.target.value))}
            disabled={!!editingReading}
          >
            <option value={0} disabled>Válassz mérőórát…</option>
            {meters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.location})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.readingDate}>Dátum</FieldLabel>
          <DatePicker value={date} onChange={setDate} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.readingValue}>Mérőóra állás</FieldLabel>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2.5">
          <ToggleOptionCard
            checked={isReset}
            onCheckedChange={setIsReset}
            icon={Replace}
            title="Óracsere történt"
            description="Új mérő került felszerelésre; a fogyasztás ettől a ponttól újraszámolódik."
            iconClassName="bg-rose-500/15 text-rose-600 dark:text-rose-400"
            activeClassName="border-rose-500/25 ring-rose-500/10"
          />
          <ToggleOptionCard
            checked={isOfficial}
            onCheckedChange={setIsOfficial}
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
    </Modal>
  );
}
