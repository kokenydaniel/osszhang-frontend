'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { MiniSwitch } from '@/components/design';
import type {
  PocketMoneySettings,
  PocketMoneyInterestBasis,
  PocketMoneyInterestOn,
} from '@/settings/pocket-money';

export function PocketMoneyInterestSettingsEditor({
  value,
  onChange,
}: {
  value: PocketMoneySettings;
  onChange: (next: PocketMoneySettings) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Havi kamatozás</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Opcionális jutalom — a zsebpénz oldalon hónap végén rögzíthető korrekcióként.
          </p>
        </div>
        <MiniSwitch
          checked={value.interest_enabled}
          onChange={(interest_enabled) => onChange({ ...value, interest_enabled })}
          label="Bekapcsolva"
          title="Havi kamatozás"
        />
      </div>

      {value.interest_enabled ? (
        <>
          <FormField label="Kamat (% / hónap)" hint="Pl. 10 = 10% a választott alapösszegre.">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={value.interest_rate_percent}
              onChange={(e) =>
                onChange({
                  ...value,
                  interest_rate_percent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                })
              }
            />
          </FormField>

          <FormField
            label="Kamat melyik összegre?"
            hint="Az eddigi egyenleg a hónap végén; a havi kiosztás csak az adott hónapban befizetett zsebpénz."
          >
            <select
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
              value={value.interest_on}
              onChange={(e) =>
                onChange({ ...value, interest_on: e.target.value as PocketMoneyInterestOn })
              }
            >
              <option value="balance">Teljes egyenleg (eddigi összeg, hónap végén)</option>
              <option value="month_allowance">Csak a hónapban kiosztott zsebpénz</option>
            </select>
          </FormField>

          <FormField
            label="Mikor jár kamat?"
            hint="Költés esetén a „bent maradt” szabály az előző mező alapján számol."
          >
            <select
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
              value={value.interest_basis}
              onChange={(e) =>
                onChange({ ...value, interest_basis: e.target.value as PocketMoneyInterestBasis })
              }
            >
              <option value="no_expense">Csak ha nem költött a hónapban</option>
              <option value="remaining">Költés után is — a bent maradt részre</option>
            </select>
          </FormField>
        </>
      ) : null}
    </div>
  );
}
