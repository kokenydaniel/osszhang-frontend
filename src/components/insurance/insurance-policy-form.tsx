'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { DatePicker } from '@/components/ui/DatePicker';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { today as todayIso } from '@/utils';
import { MiniSwitch } from '@/components/design';
import { paymentFrequencyLabel } from '@/helpers/insurance-budget';
import { periodsPerYear } from '@/calculations/insurance';
import type { InsurancePolicyFormValues, InsurancePaymentFrequency } from '@/types/insurance';

const FREQUENCIES: InsurancePaymentFrequency[] = ['monthly', 'quarterly', 'semiannual', 'annual'];

type InsurancePolicyFormProps = {
  values: InsurancePolicyFormValues;
  currencies: string[];
  categories: string[];
  onChange: (patch: Partial<InsurancePolicyFormValues>) => void;
};

export function InsurancePolicyForm({ values, currencies, onChange }: InsurancePolicyFormProps) {
  const isLife = values.policyKind === 'life_investment';
  const paying = !values.premiumFree;

  const paymentNum = Math.max(0, Number(values.paymentAmount) || 0);
  const estimatedAnnual = paying
    ? paymentNum > 0
      ? paymentNum * periodsPerYear(values.paymentFrequency)
      : Math.max(0, Number(values.annualPremium) || 0)
    : 0;

  return (
    <div className="space-y-4">
      <FormField label="Megnevezés" hint="Pl. KGFB, CASCO, életbiztosítás">
        <Input
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Szerződés neve"
        />
      </FormField>

      <FormField label="Típus">
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
          value={values.policyKind}
          onChange={(e) =>
            onChange({
              policyKind: e.target.value as InsurancePolicyFormValues['policyKind'],
            })
          }
        >
          <option value="general">Általános (KGFB, CASCO, lakás…)</option>
          <option value="life_investment">Élet / unit-linked (alapérték)</option>
        </select>
      </FormField>

      <FormField label="Biztosító">
        <Input
          value={values.insurer}
          onChange={(e) => onChange({ insurer: e.target.value })}
          placeholder="Pl. Groupama, Allianz"
        />
      </FormField>

      {isLife ? (
        <FormField
          label="Befektetési érték (aktuális)"
          hint="A befizetett összegek alapkezelése — frissítsd, ha változik."
        >
          <Input
            type="number"
            min={0}
            step={1}
            value={values.fundValue}
            onChange={(e) => onChange({ fundValue: e.target.value })}
            placeholder="0"
          />
        </FormField>
      ) : null}

      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <MiniSwitch
          checked={values.premiumFree}
          onChange={(premiumFree) =>
            onChange({
              premiumFree,
              budgetSyncEnabled: premiumFree ? false : values.budgetSyncEnabled,
              paymentAmount: premiumFree ? '' : values.paymentAmount,
              annualPremium: premiumFree ? '' : values.annualPremium,
            })
          }
          label="Díjmentesített (nem fizetek díjat)"
          title="Pl. régi életbiztosítás, ahol már csak az értéket követed"
        />
      </div>

      {paying ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Fizetési gyakoriság">
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm"
                value={values.paymentFrequency}
                onChange={(e) =>
                  onChange({ paymentFrequency: e.target.value as InsurancePaymentFrequency })
                }
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {paymentFrequencyLabel(f).charAt(0).toUpperCase() + paymentFrequencyLabel(f).slice(1)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label={`Díj összege (${paymentFrequencyLabel(values.paymentFrequency)})`}
              hint="Pl. negyedéves KGFB összege"
            >
              <Input
                type="number"
                min={0}
                step={1}
                value={values.paymentAmount}
                onChange={(e) => onChange({ paymentAmount: e.target.value })}
                placeholder="0"
              />
            </FormField>
          </div>

          <p className="text-xs text-muted-foreground -mt-2">
            Becsült éves díj:{' '}
            <strong>
              {estimatedAnnual > 0
                ? `${estimatedAnnual.toLocaleString('hu-HU')} ${values.currency}`
                : '—'}
            </strong>
          </p>

          <FormField label="Éves díj (opcionális)" hint="Ha üres, a gyakoriság × díj számítódik.">
            <Input
              type="number"
              min={0}
              step={1}
              value={values.annualPremium}
              onChange={(e) => onChange({ annualPremium: e.target.value })}
              placeholder="Automatikus"
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
        </>
      ) : (
        <FormField label="Pénznem (érték megjelenítéshez)">
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
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Megújítás dátuma">
          <DatePicker
            value={values.renewalDate}
            onChange={(renewalDate) => onChange({ renewalDate })}
            placeholder="Válassz dátumot"
          />
        </FormField>
        <FormField
          label="Fedezet / lejárat"
          hint="Ha múltbeli, mentéskor automatikusan „megszűnt” lesz a szerződés."
        >
          <DatePicker
            value={values.coveredUntil}
            onChange={(coveredUntil) => {
              const patch: Partial<InsurancePolicyFormValues> = { coveredUntil };
              if (coveredUntil && coveredUntil < todayIso()) {
                patch.isActive = false;
              }
              onChange(patch);
            }}
            placeholder="Válassz dátumot"
          />
        </FormField>
      </div>

      <FormField label="Megjegyzés" hint="Kötvényszám, fedezet részletei">
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Pl. kötvényszám, önrész…"
        />
      </FormField>

      {paying && paymentNum > 0 ? (
        <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
          <MiniSwitch
            checked={values.budgetSyncEnabled}
            onChange={(budgetSyncEnabled) => onChange({ budgetSyncEnabled })}
            label="Költségvetésbe szinkron"
            title="A díj automatikusan megjelenik a költségvetésben a választott gyakorisággal"
          />
          {values.budgetSyncEnabled ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Szinkron indulása (hónap)"
                hint="Ettől a hónaptól jelennek meg a fizetendő díjak. A nap csak technikai — a hónap számít."
              >
                <MonthPicker
                  value={values.budgetStartMonth}
                  onChange={(budgetStartMonth) => onChange({ budgetStartMonth })}
                  placeholder="Válassz hónapot"
                />
              </FormField>
              <FormField label="Esedékesség napja (1–28)">
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={values.budgetDueDay}
                  onChange={(e) => onChange({ budgetDueDay: e.target.value })}
                />
              </FormField>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <MiniSwitch
          checked={values.isActive}
          onChange={(isActive) => onChange({ isActive })}
          label={values.isActive ? 'Aktív szerződés' : 'Megszűnt'}
          title="Kézi állapot — a múltbeli fedezet vége mentéskor automatikusan megszűntre áll"
        />
        {values.coveredUntil && values.coveredUntil < todayIso() ? (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
            A fedezet vége múltbeli — mentéskor megszűntnek jelölődik.
          </p>
        ) : null}
      </div>
    </div>
  );
}
