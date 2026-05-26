'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import type { MetersSettings } from '@/lib/metersSettings';

interface MetersNewMeterFormProps {
  metersSettings: MetersSettings;
  newMeterName: string;
  onNewMeterNameChange: (value: string) => void;
  newMeterUnit: string;
  onNewMeterUnitChange: (value: string) => void;
  newMeterLoc: string;
  onNewMeterLocChange: (value: string) => void;
  onApplyTemplate: (template: MetersSettings['templates'][number]) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function MetersNewMeterForm({
  metersSettings,
  newMeterName,
  onNewMeterNameChange,
  newMeterUnit,
  onNewMeterUnitChange,
  newMeterLoc,
  onNewMeterLocChange,
  onApplyTemplate,
  onSubmit,
}: MetersNewMeterFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
                onClick={() => onApplyTemplate(template)}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <FieldLabel info={HELP.meters.newMeterName}>Megnevezés</FieldLabel>
        <Input
          placeholder="pl. Villanyóra, Vízóra (Nappali)"
          value={newMeterName}
          onChange={(e) => onNewMeterNameChange(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.newMeterUnit}>Mértékegység</FieldLabel>
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
            value={newMeterUnit}
            onChange={(e) => onNewMeterUnitChange(e.target.value)}
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
          <Input value={newMeterLoc} onChange={(e) => onNewMeterLocChange(e.target.value)} />
        </div>
      </div>
      <Button type="submit" className="mt-1">
        Mérőóra létrehozása
      </Button>
    </form>
  );
}
