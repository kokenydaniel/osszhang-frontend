'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import type { PocketMoneySettings } from '@/settings/pocket-money';

export function PocketMoneySettingsEditor({
  value,
  onChange,
}: {
  value: PocketMoneySettings;
  onChange: (next: PocketMoneySettings) => void;
}) {
  return (
    <div className="space-y-4">
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
      <FormField
        label="Támogatott pénznemek"
        hint="Vesszővel elválasztva, pl. HUF, EUR"
      >
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
    </div>
  );
}
