'use client';

import { useState, type ReactNode } from 'react';
import { StatCard, InsightBanner } from '@/components/design';
import { PageCollapsibleSection } from '@/components/design/page-collapsible-section';
import { Button } from '@/components/ui/button';
import { formatHUF } from '@/utils';
import type { AiMeta, AiTravelPlan } from '@/types/ai';
import type { TravelFormInput } from '@/types/travel';
import { travelCostBreakdownEntries } from '@/calculations/travel';
import { useTravelCostAdjustments } from '@/hooks/useTravelCostAdjustments';
import { downloadTravelPlanPdf } from '@/helpers/travel-export';
import { AlertTriangle, CalendarDays, Download, Loader2, PiggyBank, Wallet } from 'lucide-react';
import { TravelTransportPanel } from './travel-transport-panel';
import { TravelFinancialPanel } from './travel-financial-panel';
import { TravelComparisonPanel } from './travel-comparison-panel';
import { TravelCostChart } from './travel-cost-chart';
import { TravelCostEditor } from './travel-cost-editor';
import { TravelDayItinerary } from './travel-day-itinerary';

interface TravelResultProps {
  plan: AiTravelPlan;
  formValues: TravelFormInput;
  targetDate?: string | null;
  meta?: AiMeta | null;
  canSaveGoal: boolean;
  isSavingGoal: boolean;
  onSaveAsGoal: () => void;
  onPlanChange: (plan: AiTravelPlan) => void;
}

const COST_LABELS: Record<string, string> = {
  transport: 'Közlekedés',
  accommodation: 'Szállás',
  food: 'Étel & ital',
  activities: 'Programok',
  insurance: 'Utazásbiztosítás',
  miscellaneous: 'Egyéb / puffer',
};

function TravelResultSection({
  title,
  badge,
  description,
  children,
}: {
  title: string;
  badge?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge ? (
            <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p> : null}
      </div>
      <div className="border-t border-border px-4 py-3 space-y-3">{children}</div>
    </section>
  );
}

export function TravelResult({
  plan,
  formValues,
  targetDate,
  meta,
  canSaveGoal,
  isSavingGoal,
  onSaveAsGoal,
  onPlanChange,
}: TravelResultProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const {
    lineItems,
    adjustedPlan,
    costSummary,
    setItemStatus,
    setItemAmount,
    setItemLabel,
    setItemSplit,
    removeItem,
    addItem,
  } = useTravelCostAdjustments({ plan, targetDate, onPlanChange });

  const breakdownEntries = travelCostBreakdownEntries(adjustedPlan.cost_breakdown);
  const remaining = adjustedPlan.remaining_to_pay_huf ?? costSummary.remainingToPayHuf;

  const handlePdfDownload = async () => {
    setIsDownloadingPdf(true);
    try {
      const ok = await downloadTravelPlanPdf(adjustedPlan, formValues, meta);
      if (!ok) {
        window.alert('A PDF letöltése nem sikerült. Próbáld újra később.');
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {meta?.fallback_used ? (
        <InsightBanner tone="warning" icon={AlertTriangle} title="AI helyett szabályalapú terv">
          A mesterséges intelligencia most nem elérhető — a rendszer reális minimum költségekből készített tervet.
          {meta.failure_reason ? ` (${meta.failure_reason})` : null}
        </InsightBanner>
      ) : null}

      {plan.warning ? (
        <InsightBanner tone="warning" icon={AlertTriangle} title="Költségkeret figyelmeztetés">
          {plan.warning}
        </InsightBanner>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{adjustedPlan.destination}</h2>
          {adjustedPlan.summary ? (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{adjustedPlan.summary}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handlePdfDownload()}
            disabled={isDownloadingPdf}
          >
            {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            PDF letöltés
          </Button>
          {canSaveGoal ? (
            <Button type="button" variant="outline" onClick={onSaveAsGoal} disabled={isSavingGoal} className="gap-2">
              {isSavingGoal ? <Loader2 size={16} className="animate-spin" /> : <PiggyBank size={16} />}
              Megtakarítási cél
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="A mi költségünk"
          value={formatHUF(adjustedPlan.total_estimated_cost)}
          hint={
            costSummary.hasSplitItems
              ? `Teljes költség: ${formatHUF(costSummary.totalFullHuf)}`
              : remaining !== adjustedPlan.total_estimated_cost
                ? `Hátralévő: ${formatHUF(remaining)}`
                : undefined
          }
          icon={Wallet}
        />
        <StatCard label="Napok" value={String(adjustedPlan.duration_days)} icon={CalendarDays} />
        <StatCard label="Költségkeret" value={formatHUF(adjustedPlan.total_budget)} icon={Wallet} />
        <StatCard
          label="Hátralévő / nap"
          value={formatHUF(remaining / Math.max(1, adjustedPlan.duration_days))}
          hint={costSummary.paidTotalHuf > 0 ? `Kifizetve: ${formatHUF(costSummary.paidTotalHuf)}` : undefined}
          icon={CalendarDays}
        />
      </div>

      <TravelFinancialPanel financialFit={adjustedPlan.financial_fit} />

      <PageCollapsibleSection
        title="Költségek szerkesztése"
        badge={formatHUF(remaining)}
        description="Kifizetve / kizárva / megosztás / új tétel — a Belefér blokk automatikusan frissül"
        defaultOpen={false}
      >
        <TravelCostEditor
          lineItems={lineItems}
          summary={costSummary}
          onStatusChange={setItemStatus}
          onAmountChange={setItemAmount}
          onLabelChange={setItemLabel}
          onSplitChange={setItemSplit}
          onRemove={removeItem}
          onAdd={addItem}
        />
      </PageCollapsibleSection>

      {adjustedPlan.transport_detail ? (
        <TravelTransportPanel detail={adjustedPlan.transport_detail} />
      ) : null}

      {adjustedPlan.comparison ? (
        <TravelComparisonPanel comparison={adjustedPlan.comparison} />
      ) : null}

      <TravelResultSection title="Költségbontás és megoszlás" badge={formatHUF(adjustedPlan.total_estimated_cost)}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Kategória</th>
                  <th className="py-2 font-medium text-right">Összeg</th>
                  <th className="py-2 pl-4 font-medium text-right">Arány</th>
                </tr>
              </thead>
              <tbody>
                {breakdownEntries.map(([key, amount]) => {
                  const share =
                    adjustedPlan.total_estimated_cost > 0
                      ? (amount / adjustedPlan.total_estimated_cost) * 100
                      : 0;
                  if (amount <= 0) return null;
                  return (
                    <tr key={key} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-4">{COST_LABELS[key] ?? key}</td>
                      <td className="py-2.5 text-right font-medium">{formatHUF(amount)}</td>
                      <td className="py-2.5 pl-4 text-right text-muted-foreground">{share.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TravelCostChart breakdown={adjustedPlan.cost_breakdown} total={adjustedPlan.total_estimated_cost} />
        </div>
      </TravelResultSection>

      <TravelResultSection title="Napi program" badge={`${adjustedPlan.duration_days} nap`}>
        <TravelDayItinerary days={adjustedPlan.daily_itinerary} />
      </TravelResultSection>
    </div>
  );
}
