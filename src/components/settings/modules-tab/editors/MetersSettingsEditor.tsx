'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/FormField';
import { Card, CardContent } from '@/components/ui/card';
import type { MeterLocationGroup, MeterTemplate, MetersSettings } from '@/settings/meters';

const emptyTemplate = (location: string): MeterTemplate => ({
  name: '',
  unit: 'kWh',
  location,
});

export type MetersSettingsSection = 'all' | 'general' | 'templates' | 'alerts' | 'locations';

export function MetersSettingsEditor({
  value,
  onChange,
  section = 'all',
}: {
  value: MetersSettings;
  onChange: (next: MetersSettings) => void;
  section?: MetersSettingsSection;
}) {
  const show = (part: MetersSettingsSection) => section === 'all' || section === part;
  const updateTemplate = (index: number, patch: Partial<MeterTemplate>) => {
    onChange({
      ...value,
      templates: value.templates.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  return (
    <div className="space-y-4">
      {show('general') ? (
      <FormField label="Alapértelmezett helyszín" info="Új óra létrehozásánál előre kitöltött érték. A helyszín csoportokban definiált értékek is választhatók az űrlapon.">
        <Input
          value={value.default_location}
          onChange={(e) => onChange({ ...value, default_location: e.target.value })}
          placeholder="Otthon"
        />
      </FormField>
      ) : null}

      {show('general') ? (
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div>
            <h5 className="text-sm font-semibold text-foreground">Mértékegységek</h5>
            <p className="text-xs text-muted-foreground mt-1">Gyors választás új óra hozzáadásánál.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {value.units.map((unit) => (
              <span key={unit} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 pl-2 pr-1 py-1 text-xs font-medium">
                {unit}
                {value.units.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="h-4 w-4 hover:bg-transparent text-muted-foreground hover:text-destructive"
                    onClick={() => onChange({ ...value, units: value.units.filter((u) => u !== unit) })}
                  >
                    <X size={12} />
                  </Button>
                )}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
      ) : null}

      {show('templates') ? (
      <>
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
      </>
      ) : null}

      {show('alerts') ? (
      <>
      <FormField label="Olvasás emlékeztető (hónap napja)" info="0 = kikapcsolva. Ezen a napon jelezzük, ha még nincs új leolvasás.">
        <Input
          type="number"
          min={0}
          max={28}
          value={value.reading_reminder_day}
          onChange={(e) =>
            onChange({
              ...value,
              reading_reminder_day: Math.max(0, Math.min(28, Number(e.target.value) || 0)),
            })
          }
        />
      </FormField>

      <FormField label="Fogyasztás riasztás (%)" info="0 = kikapcsolva. Előző hónaphoz képest ennyi %-os növekedésnél figyelmeztetünk.">
        <Input
          type="number"
          min={0}
          max={200}
          value={value.consumption_alert_percent}
          onChange={(e) =>
            onChange({
              ...value,
              consumption_alert_percent: Math.max(0, Math.min(200, Number(e.target.value) || 0)),
            })
          }
        />
      </FormField>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Éves összesítő a vezérlőpulton</p>
          <p className="text-xs text-muted-foreground mt-0.5">Fogyasztási trend megjelenítése az oldalsávban.</p>
        </div>
        <Switch
          checked={value.show_annual_summary_on_dashboard}
          onCheckedChange={(checked) => onChange({ ...value, show_annual_summary_on_dashboard: checked })}
        />
      </div>
      </>
      ) : null}

      {show('locations') ? (
      <>
      <div>
        <h5 className="text-sm font-semibold text-foreground">Helyszín csoportok</h5>
        <p className="text-xs text-muted-foreground mt-1">
          A Közműórák oldalon ezek szerint csoportosítjuk az órákat (pl. Otthon, Nyaraló). A helyszín neve egyezzen a csoportban szereplő címkével.
        </p>
      </div>
      {value.location_groups.map((group, gIndex) => (
        <LocationGroupRow
          key={gIndex}
          group={group}
          onChange={(next) => {
            const groups = [...value.location_groups];
            groups[gIndex] = next;
            onChange({ ...value, location_groups: groups });
          }}
          onRemove={() =>
            onChange({
              ...value,
              location_groups: value.location_groups.filter((_, i) => i !== gIndex),
            })
          }
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            ...value,
            location_groups: [...value.location_groups, { name: '', locations: [] }],
          })
        }
      >
        <Plus size={13} /> Helyszín csoport
      </Button>
      </>
      ) : null}
    </div>
  );
}

function LocationGroupRow({
  group,
  onChange,
  onRemove,
}: {
  group: MeterLocationGroup;
  onChange: (g: MeterLocationGroup) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState('');

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <FormField label="Csoport">
            <Input value={group.name} onChange={(e) => onChange({ ...group, name: e.target.value })} placeholder="Otthon" />
          </FormField>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} className="text-destructive">
          <Trash2 size={14} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {group.locations.map((loc) => (
          <span key={loc} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs">
            {loc}
            <button type="button" onClick={() => onChange({ ...group, locations: group.locations.filter((l) => l !== loc) })}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Új helyszín…" className="h-8 text-sm" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const loc = draft.trim();
            if (!loc) return;
            onChange({ ...group, locations: [...new Set([...group.locations, loc])] });
            setDraft('');
          }}
        >
          <Plus size={12} />
        </Button>
      </div>
    </div>
  );
}
