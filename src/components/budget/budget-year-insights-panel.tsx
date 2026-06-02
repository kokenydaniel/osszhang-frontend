'use client';

import classNames from 'classnames';
import { Lightbulb } from 'lucide-react';
import { SectionPanel } from '@/components/design';
import { HELP } from '@/config/help';
import type { BudgetYearInsight } from '@/calculations/budget-year';

const toneClass: Record<BudgetYearInsight['tone'], string> = {
  default: 'border-border bg-muted/30',
  primary: 'border-primary/25 bg-primary/[0.06]',
  success: 'border-emerald-500/30 bg-emerald-500/[0.06]',
  warning: 'border-amber-500/30 bg-amber-500/[0.06]',
  danger: 'border-rose-500/30 bg-rose-500/[0.06]',
};

export function BudgetYearInsightsPanel({ insights }: { insights: BudgetYearInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <SectionPanel
      title="Éves tanulságok"
      description="Gyors összefoglaló a kifizetett tételek alapján"
      icon={Lightbulb}
      tone="primary"
      info={HELP.budget.yearInsights}
      className="shadow-soft"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((item) => (
          <div
            key={item.title}
            className={classNames('rounded-lg border px-4 py-3 flex flex-col gap-1', toneClass[item.tone])}
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {item.title}
            </p>
            <p className="text-lg font-semibold text-foreground tabular-nums tracking-tight">{item.value}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.hint}</p>
          </div>
        ))}
      </div>
    </SectionPanel>
  );
}
