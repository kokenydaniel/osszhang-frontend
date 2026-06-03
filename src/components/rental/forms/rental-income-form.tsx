'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { DatePicker } from '@/components/ui/DatePicker';
import type { RentalIncomeFormValues } from '@/calculations/rental';
import type { RentalProperty } from '@/types/rental';

type Props = {
  values: RentalIncomeFormValues;
  properties: RentalProperty[];
  currencies: string[];
  periodLabel: string;
  isEdit: boolean;
  onChange: (patch: Partial<RentalIncomeFormValues>) => void;
};

export function RentalIncomeForm({
  values,
  properties,
  currencies,
  periodLabel,
  isEdit,
  onChange,
}: Props) {
  const active = properties.filter((p) => p.isActive);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Időszak: <strong>{periodLabel}</strong></p>
      <FormField label="Ingatlan" required>
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
          value={values.rentalPropertyId}
          onChange={(e) => onChange({ rentalPropertyId: e.target.value })}
          disabled={isEdit}
        >
          <option value="">— Válassz —</option>
          {active.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.tenantName ? ` (${p.tenantName})` : ''}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Esedékesség">
        <DatePicker
          value={values.dueDate}
          onChange={(v) => onChange({ dueDate: v })}
          placeholder="Esedékesség napja"
        />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Bérleti díj">
          <Input
            type="number"
            min={0}
            value={values.rentAmount}
            onChange={(e) => onChange({ rentAmount: e.target.value })}
          />
        </FormField>
        <FormField label="Közös ktg. (áthárítás)">
          <Input
            type="number"
            min={0}
            value={values.commonCostAmount}
            onChange={(e) => onChange({ commonCostAmount: e.target.value })}
          />
        </FormField>
        <FormField label="Összesen (befolyt)">
          <Input
            type="number"
            min={0}
            value={values.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
          />
        </FormField>
      </div>
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
      <FormField label="Befizetés napja" hint="Üres = még nem érkezett be — figyelmeztetés esedékesség után.">
        <DatePicker
          value={values.paidDate}
          onChange={(v) => onChange({ paidDate: v })}
          placeholder="Befizetés dátuma"
        />
      </FormField>
      <FormField label="Megjegyzés (havi)">
        <Input value={values.note} onChange={(e) => onChange({ note: e.target.value })} />
      </FormField>
    </div>
  );
}
