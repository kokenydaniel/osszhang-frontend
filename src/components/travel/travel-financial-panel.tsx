'use client';

import classNames from 'classnames';
import { PageCollapsibleSection } from '@/components/design/page-collapsible-section';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/config/help';
import { formatCurrency, formatHUF } from '@/utils';
import type {
  AiTravelEligibleSavingsItem,
  AiTravelExcludedSavingsItem,
  AiTravelFinancialFit,
} from '@/types/ai';
import type { ReactNode } from 'react';

type TravelFinancialPanelProps = {
  financialFit?: AiTravelFinancialFit;
};

type FinancialFitCardProps = {
  label: string;
  info: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  children?: ReactNode;
};

function FinancialFitCard({ label, info, value, valueClassName, children }: FinancialFitCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{label}</span>
        <InfoTooltip content={info} label={`${label} – további információ`} />
      </div>
      <p className={classNames('mt-1 font-semibold tabular-nums', valueClassName)}>{value}</p>
      {children}
    </div>
  );
}

function savingsKindLabel(kind: AiTravelEligibleSavingsItem['kind']): string {
  switch (kind) {
    case 'goal':
      return 'cél';
    case 'investment':
      return 'befektetés';
    default:
      return 'számla';
  }
}

function exclusionReasonLabel(reason: AiTravelExcludedSavingsItem['reason']): string {
  switch (reason) {
    case 'state_treasury':
      return 'Államkincstár';
    case 'separate_owner':
      return 'külön csoport';
    default:
      return 'kimarad';
  }
}

function formatSavingsItemAmount(item: AiTravelEligibleSavingsItem): string {
  const currency = (item.currency ?? 'HUF').toUpperCase();
  if (currency !== 'HUF' && item.amount_native != null) {
    return `${formatCurrency(item.amount_native, currency)} ≈ ${formatHUF(item.amount_huf)}`;
  }

  return formatHUF(item.amount_huf);
}

function savingsItemKey(item: AiTravelEligibleSavingsItem, index: number): string {
  if (item.id) return item.id;

  return `${item.kind}-${item.label}-${item.currency ?? 'HUF'}-${item.amount_native ?? item.amount_huf}-${index}`;
}

function compactFinancialSummary(financialFit: AiTravelFinancialFit): string {
  const tripCost = financialFit.trip_cost_huf ?? 0;
  const available = financialFit.available_for_trip_huf ?? 0;
  const verdict = financialFit.fits_current_budget ? 'Belefér' : 'Nem fér bele';

  return `${verdict} · Hátralévő ${formatHUF(tripCost)} · Rendelkezésre ${formatHUF(available)}`;
}

export function TravelFinancialPanel({ financialFit }: TravelFinancialPanelProps) {
  if (!financialFit) return null;

  const showMonthlySavings =
    financialFit.has_savings_schedule !== false &&
    financialFit.required_monthly_savings_huf != null &&
    !financialFit.can_pay_now;

  const travelSavings = financialFit.travel_eligible_savings_huf ?? 0;
  const savingsItems = financialFit.travel_eligible_savings_items ?? [];
  const countInSavingsTotal = financialFit.count_in_savings_total_huf ?? 0;
  const excludedItems = financialFit.travel_excluded_savings_items ?? [];
  const excludedTotal = financialFit.travel_excluded_savings_huf ?? 0;
  const monthlyCapacity = financialFit.monthly_savings_capacity_huf ?? 0;
  const monthlyBreakdown = financialFit.monthly_surplus_breakdown ?? [];

  return (
    <PageCollapsibleSection
      title="Belefér?"
      badge={financialFit.fits_current_budget ? 'Belefér' : 'Nem fér bele'}
      description={compactFinancialSummary(financialFit)}
      defaultOpen={false}
      className={financialFit.fits_current_budget ? 'border-emerald-500/25' : 'border-amber-500/25'}
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground -mt-1 mb-2">
        <span>Részletes kimutatás</span>
        <InfoTooltip content={HELP.travel.financialFit} label="Belefér – további információ" />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{financialFit.summary}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <FinancialFitCard
          label="Marad"
          info={HELP.travel.financialFitDisposable}
          value={formatHUF(financialFit.disposable_remaining_huf ?? 0)}
          valueClassName={(financialFit.disposable_remaining_huf ?? 0) < 0 ? 'text-red-700' : undefined}
        />
        <FinancialFitCard
          label="Utazásra számítható megtakarítás"
          info={HELP.travel.financialFitTravelSavings}
          value={formatHUF(travelSavings)}
        >
          {countInSavingsTotal > 0 ? (
            <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
              Bekapcsolva: {formatHUF(countInSavingsTotal)}
              {excludedTotal > 0 ? ` · kimarad: ${formatHUF(excludedTotal)}` : ''}
            </p>
          ) : null}
          {savingsItems.length > 0 ? (
            <ul className="mt-2 space-y-1 border-t border-border/60 pt-2 text-[11px]">
              {savingsItems.map((item, index) => (
                <li key={savingsItemKey(item, index)} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {item.label}
                    <span className="ml-1 text-[10px]">({savingsKindLabel(item.kind)})</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium text-foreground">
                    {formatSavingsItemAmount(item)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {excludedItems.length > 0 ? (
            <ul className="mt-2 space-y-1 border-t border-dashed border-border/60 pt-2 text-[11px]">
              <li className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Kimarad
              </li>
              {excludedItems.map((item, index) => (
                <li key={`ex-${savingsItemKey(item, index)}`} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {item.label}
                    <span className="ml-1 text-[10px]">({exclusionReasonLabel(item.reason)})</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatSavingsItemAmount(item)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </FinancialFitCard>
        <FinancialFitCard
          label="Rendelkezésre áll összesen"
          info={HELP.travel.financialFitAvailable}
          value={formatHUF(financialFit.available_for_trip_huf ?? 0)}
        />
        <FinancialFitCard
          label="Hátralévő utazási költség"
          info={HELP.travel.financialFitTripCost}
          value={formatHUF(financialFit.trip_cost_huf ?? 0)}
        >
          {showMonthlySavings ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
              <span>
                Havi félretétel ({financialFit.months} hó):{' '}
                {formatHUF(financialFit.required_monthly_savings_huf ?? 0)}
              </span>
              <InfoTooltip
                content={HELP.travel.financialFitMonthlyRequired}
                label="Havi félretétel – további információ"
              />
            </p>
          ) : null}
        </FinancialFitCard>
      </div>

      {showMonthlySavings || monthlyCapacity > 0 ? (
        <div className="mt-3 rounded-lg border border-border bg-card/40 p-3 text-sm">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Becsült havi kapacitás</span>
            <InfoTooltip
              content={HELP.travel.financialFitMonthlyCapacity}
              label="Becsült havi kapacitás – további információ"
            />
          </div>
          <p className="mt-1 font-semibold tabular-nums">{formatHUF(monthlyCapacity)}</p>
          {monthlyBreakdown.length > 0 ? (
            <ul className="mt-2 space-y-1 border-t border-border/60 pt-2 text-[11px]">
              {monthlyBreakdown.map((month) => (
                <li key={month.label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{month.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatHUF(month.income_huf)} − {formatHUF(month.expense_huf)} ={' '}
                    <span
                      className={classNames(
                        'font-medium',
                        month.surplus_huf < 0 ? 'text-red-700' : 'text-foreground',
                      )}
                    >
                      {formatHUF(month.surplus_huf)}
                    </span>
                  </span>
                </li>
              ))}
              <li className="flex justify-between gap-2 border-t border-border/40 pt-1 font-medium">
                <span>Átlag</span>
                <span className="tabular-nums">{formatHUF(monthlyCapacity)}</span>
              </li>
            </ul>
          ) : null}
        </div>
      ) : null}
    </PageCollapsibleSection>
  );
}
