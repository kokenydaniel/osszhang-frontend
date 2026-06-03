'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';
import { AccentPanel } from '@/components/design';
import { HELP } from '@/config/help';
import type { AiUtilityAnomalies } from '@/types';

type Props = {
  anomalies: AiUtilityAnomalies;
};

export function DashboardMetersAnomalyBanner({ anomalies }: Props) {
  const items = anomalies.anomalies ?? [];
  if (items.length === 0) return null;

  return (
    <AccentPanel
      tone="warning"
      icon={Sparkles}
      title="AI anomáliák ezen a hónapon"
      titleInfo={HELP.meters.aiAnomaly}
      description={`${items.length} szokatlan fogyasztási érték`}
      action={
        <Link
          href="/meters"
          className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          Mérőórák <ChevronRight size={11} />
        </Link>
      }
    >
      <ul className="space-y-1.5">
        {items.slice(0, 4).map((a) => (
          <li key={`${a.meter_id}-${a.actual}`} className="text-foreground/80 flex items-start gap-2 text-sm">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>
              <b className="font-medium text-foreground">{a.meter_name}</b>: {a.reason}
            </span>
          </li>
        ))}
        {items.length > 4 ? (
          <li className="text-xs text-muted-foreground">+{items.length - 4} további</li>
        ) : null}
      </ul>
    </AccentPanel>
  );
}
