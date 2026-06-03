'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/FormField';
import { Card, CardContent } from '@/components/ui/card';
import { HELP } from '@/config/help';
import type { SavingsSettings } from '@/settings/savings';

function StringListEditor({
  title,
  description,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  description: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const label = draft.trim();
    if (!label || items.some((x) => x.toLowerCase() === label.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...items, label]);
    setDraft('');
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div>
          <h5 className="text-sm font-semibold text-foreground">{title}</h5>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
              {items.map((item) => (
                <span key={item} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 pl-2 pr-1 py-1 text-xs font-medium">
                  {item}
                  <Button type="button" variant="ghost" size="icon-xs" className="h-4 w-4 hover:bg-transparent text-muted-foreground hover:text-destructive" onClick={() => onChange(items.filter((x) => x !== item))}>
                    <X size={12} />
                  </Button>
                </span>
              ))}
        </div>
        <div className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
          <Button type="button" variant="outline" size="sm" onClick={add} disabled={!draft.trim()}>
            <Plus size={13} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SavingsSettingsEditor({
  value,
  onChange,
}: {
  value: SavingsSettings;
  onChange: (next: SavingsSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <StringListEditor
        title="Tulajdonosok"
        description="Előre definiált tulajdonosok az új számláknál és befektetéseknél."
        items={value.owners}
        onChange={(owners) =>
          onChange({
            ...value,
            owners,
            default_owner: owners.includes(value.default_owner) ? value.default_owner : owners[0] ?? value.default_owner,
          })
        }
        placeholder="pl. Közös, Szandi…"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Alapértelmezett tulajdonos" info={HELP.savings.owner}>
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
            value={value.default_owner}
            onChange={(e) => onChange({ ...value, default_owner: e.target.value })}
            disabled={value.owners.length === 0}
          >
            <option value="">—</option>
            {value.owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Külön csoport neve" info="Opcionális — ha megadod, a megtakarítás oldalon külön szekcióban jelenik meg.">
          <Input
            value={value.separate_owner}
            onChange={(e) => onChange({ ...value, separate_owner: e.target.value })}
            placeholder="pl. vállalkozás neve"
          />
        </FormField>
      </div>

      <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/15 px-3 py-2">
        Az alapértelmezett pénznemet a Költségvetés modul beállításainál állítod (HUF / EUR / USD). Itt azt listázod,
        mely pénznemek választhatók új megtakarítási számlánál.
      </p>

      <StringListEditor
        title="Pénznemek"
        description="Új számla létrehozásánál választható pénznemek (pl. HUF, EUR)."
        items={value.currencies}
        onChange={(currencies) => onChange({ ...value, currencies })}
        placeholder="pl. HUF, EUR…"
      />

      <Card variant="muted" className="p-0">
        <CardContent className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Új tételek a megtakarítás összesítésben</p>
            <p className="text-xs text-muted-foreground mt-0.5">Alapértelmezés szerint be legyen kapcsolva új számláknál.</p>
          </div>
          <Switch
            checked={value.default_count_in_savings}
            onCheckedChange={(checked) => onChange({ ...value, default_count_in_savings: checked })}
            aria-label="Számolás a megtakarításban"
          />
        </CardContent>
      </Card>
    </div>
  );
}
