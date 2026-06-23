'use client';

import { AccentPanel } from '@/components/design';
import { HELP } from '@/config/help';
import { comparisonRows } from '@/calculations/travel';
import { formatHUF } from '@/utils';
import type { AiTravelComparison } from '@/types/ai';
import { Scale } from 'lucide-react';

type TravelComparisonPanelProps = {
  comparison?: AiTravelComparison;
  plain?: boolean;
};

export function TravelComparisonPanel({ comparison, plain = false }: TravelComparisonPanelProps) {
  const rows = comparisonRows(comparison);
  if (!rows.length) return null;

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {rows.map((row) => (
        <div key={row.key} className="rounded-lg border border-border bg-card/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.label}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatHUF(row.total_huf)}</p>
          <p className="mt-2 text-sm text-muted-foreground leading-snug">{row.summary}</p>
        </div>
      ))}
    </div>
  );

  if (plain) return content;

  return (
    <AccentPanel tone="primary" icon={Scale} title="Költség összehasonlítás" description={HELP.travel.comparison}>
      {content}
    </AccentPanel>
  );
}
