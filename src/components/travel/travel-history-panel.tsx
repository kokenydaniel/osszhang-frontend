'use client';

import { AccentPanel } from '@/components/design';
import { SkeletonTableSection } from '@/components/design/skeleton-primitives';
import { Button } from '@/components/ui/button';
import { formatHUF } from '@/utils';
import type { SavedTravelPlanRecord } from '@/types/travel';
import { transportModeLabel } from '@/calculations/travel';
import { History, Trash2 } from 'lucide-react';

type TravelHistoryPanelProps = {
  plans: SavedTravelPlanRecord[];
  loading: boolean;
  onLoad: (plan: SavedTravelPlanRecord) => void;
  onDelete: (plan: SavedTravelPlanRecord) => void;
};

export function TravelHistoryPanel({ plans, loading, onLoad, onDelete }: TravelHistoryPanelProps) {
  if (loading && plans.length === 0) {
    return <SkeletonTableSection rows={2} />;
  }

  if (plans.length === 0) {
    return null;
  }

  return (
    <AccentPanel tone="info" icon={History} title="Korábbi tervek" description="Az utolsó generált utazási tervek">
      <div className="divide-y divide-border">
        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="font-medium truncate">{plan.destination}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {plan.duration_days} nap · {plan.travelers_count} fő · {transportModeLabel(plan.transport_mode)} ·{' '}
                {formatHUF(plan.total_estimated_cost)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button type="button" size="sm" variant="outline" onClick={() => onLoad(plan)}>
                Megnyitás
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => onDelete(plan)}
                aria-label={`${plan.destination} terv törlése`}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AccentPanel>
  );
}
