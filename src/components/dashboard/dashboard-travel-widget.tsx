'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AccentPanel } from '@/components/design';
import { travelClient } from '@/lib/api-client';
import { formatHUF } from '@/utils';
import { useWalletStore } from '@/stores/useWalletStore';
import type { SavedTravelPlanRecord } from '@/types/travel';
import { transportModeLabel } from '@/calculations/travel';
import { MapPinned } from 'lucide-react';

export function DashboardTravelWidget() {
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const [plans, setPlans] = useState<SavedTravelPlanRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    void travelClient.listPlans(activeWalletId).then((rows) => {
      if (!cancelled) setPlans(rows.slice(0, 3));
    });
    return () => {
      cancelled = true;
    };
  }, [activeWalletId]);

  if (plans.length === 0) return null;

  const upcoming = plans.find((p) => p.target_date) ?? plans[0];

  return (
    <AccentPanel
      tone="primary"
      icon={MapPinned}
      title="Közelgő utazások"
      description="Mentett utazási tervek és becsült költségek"
      action={
        <Link href="/tools/travel" className="text-xs font-medium text-primary hover:underline">
          Utazástervező
        </Link>
      }
    >
      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium truncate">{plan.destination}</p>
              <p className="text-xs text-muted-foreground">
                {plan.duration_days} nap · {transportModeLabel(plan.transport_mode)}
                {plan.target_date ? ` · ${plan.target_date}` : ''}
              </p>
            </div>
            <p className="font-semibold tabular-nums shrink-0">{formatHUF(plan.total_estimated_cost)}</p>
          </div>
        ))}
        {upcoming?.target_date ? (
          <p className="text-xs text-muted-foreground pt-1 border-t border-border">
            Következő: {upcoming.destination} — {upcoming.target_date}
          </p>
        ) : null}
      </div>
    </AccentPanel>
  );
}
