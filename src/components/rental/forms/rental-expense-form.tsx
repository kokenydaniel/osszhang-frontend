'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { DatePicker } from '@/components/ui/DatePicker';
import { RENTAL_EXPENSE_TYPE_IDS } from '@/config/rental-expense-types';
import { rentalCalculations, type RentalExpenseFormValues } from '@/calculations/rental';
import type { RentalProperty } from '@/types/rental';

type Props = {
  values: RentalExpenseFormValues;
  properties: RentalProperty[];
  currencies: string[];
  isEdit: boolean;
  onChange: (patch: Partial<RentalExpenseFormValues>) => void;
};

export function RentalExpenseForm({ values, properties, currencies, isEdit, onChange }: Props) {
  return (
    <div className="space-y-4">
      <FormField label="Ingatlan" required>
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
          value={values.rentalPropertyId}
          onChange={(e) => onChange({ rentalPropertyId: e.target.value })}
          disabled={isEdit}
        >
          <option value="">— Válassz —</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Költség típusa" hint="Tulajdonosi kiadás — nem a bérlő fizeti.">
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
          value={values.expenseType}
          onChange={(e) => onChange({ expenseType: e.target.value })}
        >
          {RENTAL_EXPENSE_TYPE_IDS.map((id) => (
            <option key={id} value={id}>
              {rentalCalculations.expenseTypeLabel(id)}
            </option>
          ))}
        </select>
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Összeg">
          <Input
            type="number"
            min={0}
            value={values.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
          />
        </FormField>
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
      </div>
      <FormField label="Dátum">
        <DatePicker
          value={values.expenseDate}
          onChange={(v) => onChange({ expenseDate: v })}
          placeholder="Költség dátuma"
        />
      </FormField>
      <FormField label="Megjegyzés">
        <Input value={values.note} onChange={(e) => onChange({ note: e.target.value })} />
      </FormField>
    </div>
  );
}
