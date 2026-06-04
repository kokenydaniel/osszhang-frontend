'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { DatePicker } from '@/components/ui/DatePicker';
import { MiniSwitch } from '@/components/design';
import type { RentalPropertyFormValues } from '@/calculations/rental';

type Props = {
  values: RentalPropertyFormValues;
  currencies: string[];
  onChange: (patch: Partial<RentalPropertyFormValues>) => void;
};

export function RentalPropertyForm({ values, currencies, onChange }: Props) {
  return (
    <div className="space-y-4">
      <FormField label="Név" required>
        <Input value={values.name} onChange={(e) => onChange({ name: e.target.value })} />
      </FormField>
      <FormField label="Cím">
        <Input value={values.address} onChange={(e) => onChange({ address: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Havi bérleti díj" hint="A bérlő által fizetendő alapdíj (NAV: bevétel).">
          <Input
            type="number"
            min={0}
            value={values.monthlyRent}
            onChange={(e) => onChange({ monthlyRent: e.target.value })}
          />
        </FormField>
        <FormField
          label="Közös költség (áthárítás)"
          hint="Ha a bérlő fizeti — szintén bevétel; a társasházának fizetett összeg külön költségként rögzíthető."
        >
          <Input
            type="number"
            min={0}
            value={values.monthlyCommonCost}
            onChange={(e) => onChange({ monthlyCommonCost: e.target.value })}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Pénznem">
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
            value={values.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Esedékesség napja (minden hónapban)" hint="1–28">
          <Input
            type="number"
            min={1}
            max={28}
            value={values.dueDay}
            onChange={(e) => onChange({ dueDay: e.target.value })}
          />
        </FormField>
      </div>
      <FormField label="Bérlő neve">
        <Input value={values.tenantName} onChange={(e) => onChange({ tenantName: e.target.value })} />
      </FormField>
      <FormField label="Szerződés lejárata">
        <DatePicker
          value={values.contractEndsAt}
          onChange={(v) => onChange({ contractEndsAt: v })}
          placeholder="Válassz dátumot"
        />
      </FormField>
      <FormField label="Megjegyzés (ingatlan)">
        <Input value={values.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </FormField>
      <FormField label="Megállapodások, egyedi feltételek">
        <textarea
          className="min-h-[72px] w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
          value={values.agreementNotes}
          onChange={(e) => onChange({ agreementNotes: e.target.value })}
          placeholder="Pl. kaució, felújítási egyezmény, rezsi elszámolás módja…"
        />
      </FormField>
      <div className="flex flex-col gap-3">
        <MiniSwitch
          label="Költségvetés szinkron (bevétel)"
          checked={values.budgetSyncEnabled}
          onChange={(checked) => onChange({ budgetSyncEnabled: checked })}
        />
        <MiniSwitch
          label="Aktív ingatlan"
          checked={values.isActive}
          onChange={(checked) => onChange({ isActive: checked })}
        />
      </div>
    </div>
  );
}
