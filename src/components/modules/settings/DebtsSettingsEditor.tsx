'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/lib/helpTexts';
import type { DebtsSettings } from '@/lib/debtsSettings';

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
    </div>
  );
}
