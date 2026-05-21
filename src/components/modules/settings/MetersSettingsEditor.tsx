'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import type { MeterTemplate, MetersSettings } from '@/lib/metersSettings';

const emptyTemplate = (location: string): MeterTemplate => ({
  name: '',
  unit: 'kWh',
  location,
});

export function MetersSettingsEditor({
  value,
  onChange,
}: {
  value: MetersSettings;
  onChange: (next: MetersSettings) => void;
}) {
  const updateTemplate = (index: number, patch: Partial<MeterTemplate>) => {
    onChange({
      ...value,
      templates: value.templates.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  return (
    <div className="space-y-4">
      <FormField label="Alapértelmezett helyszín" info="Új óra létrehozásánál előre kitöltött érték.">
        <Input
          value={value.default_location}
          onChange={(e) => onChange({ ...value, default_location: e.target.value })}
          placeholder="Otthon"
        />
      </FormField>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div>
          <h5 className="text-sm font-semibold text-foreground">Mértékegységek</h5>
          <p className="text-xs text-muted-foreground mt-1">Gyors választás új óra hozzáadásánál.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {value.units.map((unit) => (
            <span key={unit} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs font-medium">
              {unit}
              {value.units.length > 1 && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onChange({ ...value, units: value.units.filter((u) => u !== unit) })}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-sm font-semibold text-foreground">Óra sablonok</h5>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Ezekből egy kattintással hozzáadhatsz új mérőórát a Közműórák oldalon.
        </p>
      </div>

      <div className="space-y-2">
        {value.templates.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-[1fr_90px_1fr_auto] gap-2 items-end rounded-xl border border-border bg-muted/10 p-3"
          >
            <FormField label="Megnevezés">
              <Input value={row.name} onChange={(e) => updateTemplate(index, { name: e.target.value })} placeholder="Villany" />
            </FormField>
            <FormField label="Egység">
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-2 text-sm appearance-none focus:border-ring outline-none"
                value={row.unit}
                onChange={(e) => updateTemplate(index, { unit: e.target.value })}
              >
                {value.units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Helyszín">
              <Input value={row.location} onChange={(e) => updateTemplate(index, { location: e.target.value })} placeholder={value.default_location} />
            </FormField>
            <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => onChange({ ...value, templates: value.templates.filter((_, i) => i !== index) })}>
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...value, templates: [...value.templates, emptyTemplate(value.default_location)] })}>
        <Plus size={13} /> Sablon sor
      </Button>
    </div>
  );
}
