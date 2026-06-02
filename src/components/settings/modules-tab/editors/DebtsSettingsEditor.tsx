'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/config/help';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DebtsSettings } from '@/settings/debts';

export function DebtsSettingsEditor({
  value,
  onChange,
}: {
  value: DebtsSettings;
  onChange: (next: DebtsSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <FormField label="Alap stratégia" info={HELP.debts.strategy}>
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
          value={value.default_strategy}
          onChange={(e) => onChange({ ...value, default_strategy: e.target.value as DebtsSettings['default_strategy'] })}
        >
          <option value="avalanche">Avalanche — legmagasabb kamat először</option>
          <option value="snowball">Snowball — legkisebb tartozás először</option>
        </select>
      </FormField>

      <FormField label="Alap extra törlesztés / hó" info="A gyorsított törlesztés szimulátor kezdőértéke.">
        <Input
          type="number"
          min={0}
          step={1000}
          value={value.default_extra_monthly || ''}
          onChange={(e) => onChange({ ...value, default_extra_monthly: Math.max(0, Number(e.target.value) || 0) })}
          placeholder="0"
        />
      </FormField>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Törlesztés a költségvetésben</p>
          <p className="text-xs text-muted-foreground mt-0.5">Fizetés rögzítésekor alapból jöjjön létre kiadás tétel.</p>
        </div>
        <Switch
          checked={value.pay_add_to_budget_default}
          onCheckedChange={(checked) => onChange({ ...value, pay_add_to_budget_default: checked })}
          aria-label="Költségvetésbe írás"
        />
      </div>

      <FormField
        label="Kategória keresés (regex)"
        info="Törlesztésnél ezzel a mintával keressük a megfelelő költségvetés kategóriát."
      >
        <Input
          value={value.payment_category_pattern}
          onChange={(e) => onChange({ ...value, payment_category_pattern: e.target.value })}
          placeholder="hitel|tartoz|törleszt"
          className="font-mono text-sm"
        />
      </FormField>

      <FormField label="Lejárat előtti emlékeztető (nap)" info="Dashboardon és listában jelezzük, ha közeledik a törlesztés.">
        <Input
          type="number"
          min={0}
          max={60}
          value={value.reminder_days_before}
          onChange={(e) =>
            onChange({
              ...value,
              reminder_days_before: Math.max(0, Math.min(60, Number(e.target.value) || 0)),
            })
          }
        />
      </FormField>

      <FormField label="Alap éves kamatláb (%)" info="Új tartozásnál előre kitöltött kamat — felülírható tételenként.">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={value.default_interest_rate_annual || ''}
          onChange={(e) =>
            onChange({
              ...value,
              default_interest_rate_annual: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
            })
          }
        />
      </FormField>

      <div>
        <h5 className="text-sm font-semibold text-foreground">Típus sablonok</h5>
        <p className="text-xs text-muted-foreground mt-1">Gyors sablon új tartozásnál — név és alap kamat.</p>
      </div>
      <div className="space-y-2">
        {value.debt_type_templates.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2 items-end rounded-xl border border-border bg-muted/10 p-3"
          >
            <FormField label="Megnevezés">
              <Input
                value={row.label}
                onChange={(e) => {
                  const next = [...value.debt_type_templates];
                  next[index] = { ...row, label: e.target.value };
                  onChange({ ...value, debt_type_templates: next });
                }}
                placeholder="Lakáshitel"
              />
            </FormField>
            <FormField label="Kamat %">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={row.default_interest_rate_annual || ''}
                onChange={(e) => {
                  const next = [...value.debt_type_templates];
                  next[index] = {
                    ...row,
                    default_interest_rate_annual: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  };
                  onChange({ ...value, debt_type_templates: next });
                }}
              />
            </FormField>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() =>
                onChange({
                  ...value,
                  debt_type_templates: value.debt_type_templates.filter((_, i) => i !== index),
                })
              }
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            ...value,
            debt_type_templates: [
              ...value.debt_type_templates,
              { label: '', default_interest_rate_annual: value.default_interest_rate_annual },
            ],
          })
        }
      >
        <Plus size={13} /> Sablon
      </Button>
    </div>
  );
}
