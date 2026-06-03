'use client';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HELP } from '@/config/help';
import type { BudgetSettings, HouseholdCurrency } from '@/settings/budget';

const selectClass =
  'h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none';

export function BudgetSettingsEditor({
  value,
  onChange,
}: {
  value: BudgetSettings;
  onChange: (next: BudgetSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <FormField
        label="Alapértelmezett pénznem"
        info="Új költségvetési tételnél, és ajánlott alapként a megtakarításoknál is. A mentett tételek saját pénznemben maradnak; az összesítők forintra váltanak élő árfolyamon."
      >
        <select
          className={selectClass}
          value={value.default_currency}
          onChange={(e) =>
            onChange({ ...value, default_currency: e.target.value as HouseholdCurrency })
          }
        >
          <option value="HUF">HUF (forint)</option>
          <option value="EUR">EUR (euró)</option>
          <option value="USD">USD (dollár)</option>
        </select>
      </FormField>

      <FormField label="Havi klónozás alapértelmezése" info={HELP.budget?.cloneMonth}>
        <select
          className={selectClass}
          value={value.clone_mode}
          onChange={(e) =>
            onChange({ ...value, clone_mode: e.target.value as BudgetSettings['clone_mode'] })
          }
        >
          <option value="all">Minden tétel az előző hónapból</option>
          <option value="budget_only">Csak keretes tételek</option>
          <option value="fixed_recurring">Keretes, nem tartalék tételek</option>
        </select>
      </FormField>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Kimaradt bevétel figyelmeztetés</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dashboardon és a költségvetésben jelzi, ha elmaradt a várható bevétel.
          </p>
        </div>
        <Switch
          checked={value.missed_income_enabled}
          onCheckedChange={(checked) => onChange({ ...value, missed_income_enabled: checked })}
          aria-label="Kimaradt bevétel"
        />
      </div>

      {value.missed_income_enabled ? (
        <FormField
          label="Türelmi napok esedékesség után"
          info="Ennyi napot várunk az esedékesség után, mielőtt „kimaradt” figyelmeztetést mutatunk."
        >
          <Input
            type="number"
            min={0}
            max={60}
            value={value.missed_income_grace_days}
            onChange={(e) =>
              onChange({
                ...value,
                missed_income_grace_days: Math.max(0, Math.min(60, Number(e.target.value) || 0)),
              })
            }
          />
        </FormField>
      ) : null}
    </div>
  );
}
