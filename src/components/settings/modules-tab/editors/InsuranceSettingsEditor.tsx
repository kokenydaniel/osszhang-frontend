'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { MiniSwitch } from '@/components/design';
import type { InsuranceSettings } from '@/settings/insurance';

export function InsuranceSettingsEditor({
  value,
  onChange,
}: {
  value: InsuranceSettings;
  onChange: (next: InsuranceSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <FormField
        label="Emlékeztető (napokkal előtte)"
        hint="Ennyi nappal a megújítás vagy lejárat előtt jelennek meg a sávban."
      >
        <Input
          type="number"
          min={1}
          max={365}
          value={value.reminder_days_before}
          onChange={(e) =>
            onChange({
              ...value,
              reminder_days_before: Math.min(365, Math.max(1, Number(e.target.value) || 30)),
            })
          }
        />
      </FormField>
      <FormField label="Alapértelmezett pénznem">
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
          value={value.default_currency}
          onChange={(e) => onChange({ ...value, default_currency: e.target.value })}
        >
          {value.currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Támogatott pénznemek" hint="Vesszővel elválasztva">
        <Input
          value={value.currencies.join(', ')}
          onChange={(e) => {
            const currencies = e.target.value
              .split(',')
              .map((c) => c.trim().toUpperCase())
              .filter(Boolean);
            onChange({
              ...value,
              currencies: currencies.length > 0 ? currencies : value.currencies,
            });
          }}
        />
      </FormField>
      <FormField
        label="Költségvetés kategória (minta)"
        hint="Regex: melyik költségkategóriába kerüljenek a szinkronizált díjak (pl. biztosít)."
      >
        <Input
          value={value.payment_category_pattern}
          onChange={(e) => onChange({ ...value, payment_category_pattern: e.target.value })}
        />
      </FormField>
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <MiniSwitch
          checked={value.budget_sync_default}
          onChange={(budget_sync_default) => onChange({ ...value, budget_sync_default })}
          label="Új szerződésnél költségvetés-szinkron alapból be"
        />
      </div>
    </div>
  );
}
