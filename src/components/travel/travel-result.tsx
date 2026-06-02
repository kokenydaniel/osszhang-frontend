'use client';

import { AccentPanel, InsightBanner, StatCard } from '@/components/design';
import { Button } from '@/components/ui/button';
import { formatHUF } from '@/utils';
import type { AiTravelPlan } from '@/types';
import { AlertTriangle, CalendarDays, Loader2, PiggyBank, Wallet } from 'lucide-react';

interface TravelResultProps {
  plan: AiTravelPlan;
  isSavingGoal: boolean;
  onSaveAsGoal: () => void;
}

const COST_LABELS: Record<keyof AiTravelPlan['cost_breakdown'], string> = {
  accommodation: 'Szállás',
  food: 'Étel & ital',
  activities: 'Programok',
  transport: 'Közlekedés',
};

export function TravelResult({ plan, isSavingGoal, onSaveAsGoal }: TravelResultProps) {
  const breakdownEntries = Object.entries(plan.cost_breakdown) as Array<
    [keyof AiTravelPlan['cost_breakdown'], number]
  >;

  return (
    <div className="flex flex-col gap-6">
      {plan.warning ? (
        <InsightBanner tone="warning" icon={AlertTriangle} title="Költségkeret figyelmeztetés">
          {plan.warning}
        </InsightBanner>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{plan.destination}</h2>
          {plan.summary ? <p className="text-sm text-muted-foreground mt-1">{plan.summary}</p> : null}
        </div>
        <Button type="button" variant="outline" onClick={onSaveAsGoal} disabled={isSavingGoal} className="gap-2 shrink-0">
          {isSavingGoal ? <Loader2 size={16} className="animate-spin" /> : <PiggyBank size={16} />}
          Mentés megtakarítási célként
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Becsült összköltség" value={formatHUF(plan.total_estimated_cost)} icon={Wallet} />
        <StatCard label="Napok" value={String(plan.duration_days)} icon={CalendarDays} />
        <StatCard label="Költségkeret" value={formatHUF(plan.total_budget)} icon={Wallet} />
        <StatCard
          label="Napi átlag"
          value={formatHUF(plan.total_estimated_cost / Math.max(1, plan.duration_days))}
          icon={CalendarDays}
        />
      </div>

      <AccentPanel tone="info" title="Költségbontás" description="Becsült kiadások kategóriánként">
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
                const share = plan.total_estimated_cost > 0 ? (amount / plan.total_estimated_cost) * 100 : 0;
                return (
                  <tr key={key} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4">{COST_LABELS[key]}</td>
                    <td className="py-2.5 text-right font-medium">{formatHUF(amount)}</td>
                    <td className="py-2.5 pl-4 text-right text-muted-foreground">{share.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AccentPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plan.daily_itinerary.map((day) => (
          <AccentPanel
            key={day.day}
            tone="primary"
            title={`${day.day}. nap — ${day.title}`}
            description={formatHUF(day.estimated_daily_cost)}
          >
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {day.activities.map((activity) => (
                <li key={activity}>{activity}</li>
              ))}
            </ul>
          </AccentPanel>
        ))}
      </div>
    </div>
  );
}
