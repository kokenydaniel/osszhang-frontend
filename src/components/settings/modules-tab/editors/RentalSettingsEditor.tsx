'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { MiniSwitch } from '@/components/design';
import type { RentalSettings } from '@/settings/rental';

export function RentalSettingsEditor({
  value,
  onChange,
}: {
  value: RentalSettings;
  onChange: (next: RentalSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <FormField
        label="Szerződés lejárat emlékeztető (nap)"
        hint="Ennyi nappal a lejárat előtt jelenik meg figyelmeztetés."
      >
        <Input
          type="number"
          min={1}
          max={365}
          value={value.contract_reminder_days_before}
          onChange={(e) =>
            onChange({
              ...value,
              contract_reminder_days_before: Math.min(365, Math.max(1, Number(e.target.value) || 60)),
            })
          }
        />
      </FormField>
      <FormField
        label="Lejárt bérleti díj türelmi nap"
        hint="Esedékesség után ennyi napig még nem jelenik meg lejárt figyelmeztetés."
      >
        <Input
          type="number"
          min={0}
          max={30}
          value={value.overdue_grace_days}
          onChange={(e) =>
            onChange({
              ...value,
              overdue_grace_days: Math.min(30, Math.max(0, Number(e.target.value) || 0)),
            })
          }
        />
      </FormField>
      <MiniSwitch
        label="Költségvetés szinkron alapértelmezés (új ingatlan)"
        checked={value.budget_sync_default}
        onChange={(checked) => onChange({ ...value, budget_sync_default: checked })}
      />
      <FormField
        label="Bevétel kategória minta"
        hint="A költségvetésben ehhez hasonló kategóriába kerül a szinkronizált bérleti díj."
      >
        <Input
          value={value.income_category_pattern}
          onChange={(e) => onChange({ ...value, income_category_pattern: e.target.value })}
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
      <FormField label="Támogatott pénznemek" hint="Vesszővel elválasztva (pl. HUF, EUR)">
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
