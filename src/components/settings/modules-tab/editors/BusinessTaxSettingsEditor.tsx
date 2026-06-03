'use client';

import { InsightBanner } from '@/components/design';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import {
  COST_RATIO_PRESETS,
  INCOME_TAX_METHOD_LABELS,
  REVENUE_BASIS_LABELS,
  TAX_REGIME_HINTS,
  TAX_REGIME_LABELS,
  type IncomeTaxMethod,
  type RevenueBasis,
  type TaxRegime,
} from '@/config/business-tax';
import type { BusinessSettings } from '@/settings/business';

const selectClass =
  'h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none';

export function BusinessTaxSettingsEditor({
  value,
  onChange,
}: {
  value: BusinessSettings;
  onChange: (next: BusinessSettings) => void;
}) {
  const setRegime = (tax_regime: TaxRegime) => {
    const next: BusinessSettings = { ...value, tax_regime };
    if (tax_regime === 'aam') {
      next.default_vat_percent = 0;
      if (next.income_tax_method === 'kata_flat') {
        next.income_tax_method = 'cost_ratio';
      }
    } else if (tax_regime === 'vat' && next.default_vat_percent === 0) {
      next.default_vat_percent = 27;
    } else if (tax_regime === 'kata') {
      next.income_tax_method = 'kata_flat';
      next.default_vat_percent = 0;
    }
    onChange(next);
  };

  const showCostRatio = value.tax_regime === 'aam' && value.income_tax_method === 'cost_ratio';

  return (
    <div className="space-y-4">
      <FormField
        label="Adózási forma"
        info="Meghatározza, hogy az ÁFA kimutatás és a bevétel összesítés hogyan értelmezze a számokat."
      >
        <select className={selectClass} value={value.tax_regime} onChange={(e) => setRegime(e.target.value as TaxRegime)}>
          {(Object.keys(TAX_REGIME_LABELS) as TaxRegime[]).map((key) => (
            <option key={key} value={key}>
              {TAX_REGIME_LABELS[key]}
            </option>
          ))}
        </select>
      </FormField>

      <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border bg-muted/15 px-3 py-2.5">
        {TAX_REGIME_HINTS[value.tax_regime]}
      </p>

      {value.tax_regime === 'kata' ? (
        <InsightBanner tone="warning" title="KATA korlátozások">
          Új KATA indulás 2022-től megszűnt. Ha még jogosult vagy, a kimutatás fix havi adóként kezeli — ellenőrizd
          könyvelővel.
        </InsightBanner>
      ) : null}

      {value.tax_regime !== 'kata' ? (
        <FormField
          label="Jövedelemadó számítás (EV)"
          info="AAM és áfa-köteles egyéni vállalkozóknál: költséghányad vagy tételes költség — a kimutatás ezt használja az „adóköteles jövedelem” becsléséhez."
        >
          <select
            className={selectClass}
            value={value.income_tax_method}
            onChange={(e) =>
              onChange({
                ...value,
                income_tax_method: e.target.value as IncomeTaxMethod,
              })
            }
          >
            {(Object.keys(INCOME_TAX_METHOD_LABELS) as IncomeTaxMethod[])
              .filter((m) => m !== 'kata_flat')
              .map((key) => (
                <option key={key} value={key}>
                  {INCOME_TAX_METHOD_LABELS[key]}
                </option>
              ))}
          </select>
        </FormField>
      ) : null}

      {showCostRatio ? (
        <FormField
          label="Költséghányad (%)"
          info="A bevétel ezen hányada minősül elismert költségnek (pl. 40% → adóköteles jövedelem ≈ bevétel 60%-a). Gyakori: 40, 80 vagy 90 — tevékenységtől függ."
          hint={`Gyors választás: ${COST_RATIO_PRESETS.join(' / ')} %`}
        >
          <Input
            type="number"
            min={0}
            max={100}
            value={value.cost_ratio_percent}
            onChange={(e) =>
              onChange({
                ...value,
                cost_ratio_percent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
              })
            }
          />
        </FormField>
      ) : null}

      <FormField
        label="Bevétel számítás alapja"
        info="Magyar adózásnál a bevétel általában számla vagy pénztárgép bizonylat alapján keletkezik. Jelöld a rendelésnél a számlát / nyugtát, vagy add meg a számlasorszámot."
      >
        <select
          className={selectClass}
          value={value.revenue_basis}
          onChange={(e) => onChange({ ...value, revenue_basis: e.target.value as RevenueBasis })}
        >
          {(Object.keys(REVENUE_BASIS_LABELS) as RevenueBasis[]).map((key) => (
            <option key={key} value={key}>
              {REVENUE_BASIS_LABELS[key]}
            </option>
          ))}
        </select>
      </FormField>

      {value.tax_regime === 'vat' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Alap ÁFA (%)" info="Új rendelésnél és az ÁFA kimutatásnál.">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={value.default_vat_percent}
              onChange={(e) =>
                onChange({
                  ...value,
                  default_vat_percent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                })
              }
            />
          </FormField>
          <FormField label="Ár megadása">
            <select
              className={selectClass}
              value={value.price_input_mode}
              onChange={(e) =>
                onChange({ ...value, price_input_mode: e.target.value as BusinessSettings['price_input_mode'] })
              }
            >
              <option value="gross">Bruttó</option>
              <option value="net">Nettó</option>
            </select>
          </FormField>
        </div>
      ) : null}
    </div>
  );
}
