'use client';

import { useMemo } from 'react';
import { Scale, Receipt, Info } from 'lucide-react';
import { InsightBanner, ProgressBar, SectionPanel } from '@/components/design';
import { REVENUE_BASIS_LABELS } from '@/config/business-tax';
import { formatAamLimitShort, getAamAnnualLimitHuf } from '@/config/aam-limits';
import { businessCalculations } from '@/calculations/business';
import { BusinessRevenueReconciliation } from '@/components/business/business-revenue-reconciliation';
import { BusinessTaxRevenueBreakdown } from '@/components/business/business-tax-revenue-breakdown';
import { formatHUF } from '@/utils';
import type { BusinessSettings } from '@/settings/business';
import type { BusinessOrder } from '@/types/business';

type Props = {
  selectedYear: number;
  orders: BusinessOrder[];
  bizSettings: BusinessSettings;
};

function usageBarTone(percent: number): 'thresholds' | 'danger' {
  if (percent >= 90) return 'thresholds';
  return 'thresholds';
}

export function BusinessAnnualTaxPanel({ selectedYear, orders, bizSettings }: Props) {
  const revenue = useMemo(
    () => businessCalculations.computeAnnualRevenue(orders, selectedYear, bizSettings),
    [orders, selectedYear, bizSettings],
  );

  const regime = bizSettings.tax_regime;

  if (regime === 'aam') {
    const limit = getAamAnnualLimitHuf(selectedYear);
    const used = revenue.total;
    const remaining = Math.max(0, limit - used);
    const percent = limit > 0 ? (used / limit) * 100 : 0;
    const basisLabel = REVENUE_BASIS_LABELS[revenue.revenueBasis];

    return (
      <SectionPanel
        title={`AAM bevételi keret · ${selectedYear}`}
        description={`Hivatalos értékhatár: ${formatAamLimitShort(limit)} (belföldi teljesítések)`}
        icon={Scale}
        tone={percent >= 100 ? 'warning' : percent >= 85 ? 'info' : 'primary'}
        className="shadow-soft"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{formatHUF(used)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Számított bevétel ({basisLabel}) · {revenue.orderCount} rendelés
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground tabular-nums">
                {percent >= 100 ? 'Keret felett' : `${Math.round(percent)}%`}
              </p>
              <p className="text-xs text-muted-foreground">
                {percent >= 100
                  ? `+${formatHUF(used - limit)}`
                  : `Marad: ${formatHUF(remaining)}`}
              </p>
            </div>
          </div>

          <ProgressBar
            value={Math.min(used, limit)}
            max={limit}
            size="md"
            tone={usageBarTone(percent)}
            className={percent > 100 ? '[&>span]:!w-full' : undefined}
            barStyle={percent > 100 ? { width: '100%', backgroundColor: 'var(--destructive, oklch(0.58 0.22 25))' } : undefined}
          />

          {percent >= 100 ? (
            <InsightBanner tone="warning" icon={Info} title="Értékhatár túllépése (becslés)">
              A rögzített bevételek összege meghaladja a {selectedYear}. évi AAM keretet ({formatAamLimitShort(limit)}).
              Ilyenkor az alanyi adómentesség megszűnhet — egyeztess könyvelővel / NAV útmutatóval.
            </InsightBanner>
          ) : percent >= 85 ? (
            <InsightBanner tone="info" icon={Info} title="Közeledés a kerethez">
              Még kb. {formatHUF(remaining)} van a {formatAamLimitShort(limit)} keretig. Figyeld az év hátralévő
              részét is — a NAV a tárgyévi várható bevételt is nézi.
            </InsightBanner>
          ) : null}

          <BusinessRevenueReconciliation revenue={revenue} selectedYear={selectedYear} />

          <BusinessTaxRevenueBreakdown revenue={revenue} selectedYear={selectedYear} />

          <p className="text-xs text-muted-foreground leading-relaxed">
            AAM keret: {formatAamLimitShort(limit)} ({selectedYear}). A fenti összesítés számai összeadódnak; a Számlázz.hu
            értékét az „AAM bevétel” sorral hasonlítsd (nem a „Összes rendelés” sorral).{' '}
            <a
              href="https://nav.gov.hu/ado/afa/Emelkedik_az_alanyi_adomentesseg_ertekhatara"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              NAV tájékoztató
            </a>
          </p>
        </div>
      </SectionPanel>
    );
  }

  if (regime === 'vat') {
    const used = revenue.total;
    const basisLabel = REVENUE_BASIS_LABELS[revenue.revenueBasis];

    return (
      <SectionPanel
        title={`Áfa-köteles éves bevétel · ${selectedYear}`}
        description="Nincs fix „AAM-szerű” plafon — az ÁFA és bevallások külön szabályok szerint"
        icon={Receipt}
        tone="info"
        className="shadow-soft"
      >
        <div className="space-y-3">
          <p className="text-2xl font-semibold tabular-nums">{formatHUF(used)}</p>
          <p className="text-sm text-muted-foreground">
            {basisLabel} · {revenue.orderCount} rendelés a {selectedYear}. évben.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Áfa-köteles vállalkozásnál nincs egyetlen éves „mentes keret” mint AAM-nál. A havi ÁFA kimutatást a Havi
            nézetben látod; az éves adó- és ÁFA-kötelezettséget könyvelővel / NAV-val érdemes összevetni. A
            rögzített rendelésösszegek itt csak saját nyilvántartás.
          </p>
        </div>
      </SectionPanel>
    );
  }

  if (regime === 'kata') {
    const used = revenue.total;

    return (
      <SectionPanel
        title={`KATA · ${selectedYear} bevétel összesítő`}
        description="Tájékoztató — a KATA új belépőknek megszűnt"
        icon={Scale}
        tone="info"
        className="shadow-soft"
      >
        <div className="space-y-3">
          <p className="text-2xl font-semibold tabular-nums">{formatHUF(used)}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            KATA esetén fix havi adó volt a jellemző (nem AAM-szerű 20 milliós ÁFA-mentes keret). Új KATA indulás
            2022-től nem lehetséges; ha még jogosult vagy, a bevétel összesítő csak összehasonlításhoz szolgál —
            {REVENUE_BASIS_LABELS[revenue.revenueBasis]}, {revenue.orderCount} rendelés.
          </p>
        </div>
      </SectionPanel>
    );
  }

  return null;
}
