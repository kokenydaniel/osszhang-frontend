'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import type { MetersPageState } from '@/components/modules/meters/hooks/use-meters-page-state';

type MetersNewMeterModalProps = Pick<
  MetersPageState,
  | 'isNewMeterModalOpen'
  | 'setIsNewMeterModalOpen'
  | 'metersSettings'
  | 'newMeterName'
  | 'setNewMeterName'
  | 'newMeterUnit'
  | 'setNewMeterUnit'
  | 'newMeterLoc'
  | 'setNewMeterLoc'
  | 'applyMeterTemplate'
  | 'handleMeterSubmit'
>;

export function MetersNewMeterModal({
  isNewMeterModalOpen,
  setIsNewMeterModalOpen,
  metersSettings,
  newMeterName,
  setNewMeterName,
  newMeterUnit,
  setNewMeterUnit,
  newMeterLoc,
  setNewMeterLoc,
  applyMeterTemplate,
  handleMeterSubmit,
}: MetersNewMeterModalProps) {
  return (
    <Modal isOpen={isNewMeterModalOpen} onClose={() => setIsNewMeterModalOpen(false)} title="Új mérőóra hozzáadása">
      <form onSubmit={handleMeterSubmit} className="flex flex-col gap-4">
        {metersSettings.templates.length > 0 && (
          <div className="space-y-2">
            <FieldLabel info="Sablonok a Beállítások → Modulok → Közműórák alól">Gyors sablon</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {metersSettings.templates.map((template) => (
                <Button
                  key={`${template.name}-${template.unit}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyMeterTemplate(template)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.newMeterName}>Megnevezés</FieldLabel>
          <Input placeholder="pl. Villanyóra, Vízóra (Nappali)" value={newMeterName} onChange={(e) => setNewMeterName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.newMeterUnit}>Mértékegység</FieldLabel>
            <select
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
              value={newMeterUnit}
              onChange={(e) => setNewMeterUnit(e.target.value)}
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
            <Input value={newMeterLoc} onChange={(e) => setNewMeterLoc(e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="mt-1">
          Mérőóra létrehozása
        </Button>
      </form>
    </Modal>
  );
}
