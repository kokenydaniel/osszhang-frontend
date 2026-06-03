'use client';

import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { AccentPanel, InsightBanner } from '@/components/design';
import { REVENUE_BASIS_LABELS, TAX_REGIME_LABELS } from '@/config/business-tax';
import { aiFeatureLabel } from '@/config/ai-features';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveBusinessSettings, type BusinessSettings } from '@/settings/business';
import { formatHUF } from '@/utils';
import {
  computeMonthlyTaxRevenue,
  estimatedAamTaxableIncome,
} from '@/utils/business-tax-revenue';
import type { BusinessOrder } from '@/types/business';

type Props = {
  year: number;
  month: number;
  orders: BusinessOrder[];
  bizSettings?: BusinessSettings;
};

export function BusinessVatEstimatePanel({ year, month, orders, bizSettings: bizSettingsProp }: Props) {
  const user = useAuthStore((s) => s.user);
  const bizSettings = bizSettingsProp ?? resolveBusinessSettings(user?.household ?? null);
  const isAam = bizSettings.tax_regime === 'aam' || bizSettings.default_vat_percent === 0;
  const isVat = bizSettings.tax_regime === 'vat';

  const platformEnabled = isPlatformFeatureEnabled(user, 'enable_ai_vat_estimate');

  const revenue = useMemo(
    () => computeMonthlyTaxRevenue(orders, year, month, bizSettings),
    [orders, year, month, bizSettings],
  );

  const aamEstimates = useMemo(
    () => estimatedAamTaxableIncome(revenue.total, bizSettings),
    [revenue.total, bizSettings],
  );

  if (!platformEnabled) return null;

  const revenueBasisLabel = REVENUE_BASIS_LABELS[revenue.revenueBasis];
  const skipped = revenue.skippedCount;
  const vatPercent = isAam ? 0 : bizSettings.default_vat_percent;
  const vatAmount =
    bizSettings.price_input_mode === 'net'
      ? Math.round(revenue.total * vatPercent) / 100
      : Math.round(revenue.total - revenue.total / (1 + vatPercent / 100)) || 0;
  const grossTotal =
    bizSettings.price_input_mode === 'net' ? revenue.total + vatAmount : revenue.total;

  if (isAam) {
    const showTaxable =
      aamEstimates.taxable != null && bizSettings.income_tax_method === 'cost_ratio';
    return (
      <InsightBanner tone="info" icon={Receipt} title="AAM — havi bevétel és jövedelem becslés">
        <div className="text-sm leading-relaxed space-y-2">
          <p>
            {TAX_REGIME_LABELS.aam}. Alap: <strong>{revenueBasisLabel}</strong>
            {revenue.orderCount > 0
              ? ` — ${revenue.orderCount} rendelés, nettó bevétel ${formatHUF(revenue.total)}`
              : ` — ${year}. ${String(month).padStart(2, '0')}. hónapban nincs bevétel a szűrő szerint`}
            .
          </p>
          {skipped > 0 ? (
            <p className="text-xs text-muted-foreground">
              {skipped} rendelés kimaradt ebben a hónapban (nincs „számla készült” és nincs érvényes számlasorszám).
              Ellenőrizd a rendeléslistában a bizonylat jelölést.
            </p>
          ) : null}
          {showTaxable ? (
            <p>
              Költséghányad ({bizSettings.cost_ratio_percent}%): elismert költség{' '}
              <span className="tabular-nums font-medium">{formatHUF(aamEstimates.costShare ?? 0)}</span>
              {' — '}
              <strong>becsült adóköteles jövedelem</strong>{' '}
              <span className="tabular-nums font-semibold">{formatHUF(aamEstimates.taxable ?? 0)}</span>
            </p>
          ) : bizSettings.income_tax_method === 'actual' ? (
            <p className="text-xs text-muted-foreground">
              Tételes költségelésnél a teljes nettó bevétel lehet az alap — a tényleges költségeket külön kövesd.
            </p>
          ) : null}
        </div>
      </InsightBanner>
    );
  }

  if (bizSettings.tax_regime === 'kata') {
    return (
      <InsightBanner tone="info" icon={Receipt} title="KATA — havi bevétel">
        <p className="text-sm leading-relaxed">
          Rögzített bevétel ({revenueBasisLabel}):{' '}
          <span className="tabular-nums font-semibold">{formatHUF(revenue.total)}</span>
          {revenue.orderCount > 0 ? ` (${revenue.orderCount} rendelés)` : ''}.
        </p>
      </InsightBanner>
    );
  }

  return (
    <AccentPanel tone="info" icon={Receipt} title={isVat ? aiFeatureLabel('vat_estimate') : 'Havi bevétel'}>
      <p className="text-sm text-muted-foreground mb-3">
        {vatPercent}% ÁFA, {bizSettings.price_input_mode === 'net' ? 'nettó' : 'bruttó'} árak — {revenueBasisLabel}.
        {skipped > 0 ? ` ${skipped} rendelés kimaradt a szűrő miatt.` : ''}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Nettó bevétel</div>
          <div className="font-semibold tabular-nums">{formatHUF(revenue.total)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">ÁFA</div>
          <div className="font-semibold tabular-nums">{formatHUF(vatAmount)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Bruttó</div>
          <div className="font-semibold tabular-nums">{formatHUF(grossTotal)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Rendelések</div>
          <div className="font-semibold tabular-nums">{revenue.orderCount}</div>
        </div>
      </div>
    </AccentPanel>
  );
}
