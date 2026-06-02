import Link from 'next/link';
import { formatHUF } from '@/utils';
import { HELP } from '@/config/help';
import { AccentPanel } from '@/components/design';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { MissedIncomeSummary } from '@/calculations/budget-income';

type BudgetMissedIncomeBannerProps = {
  summary: MissedIncomeSummary | null;
};

export function BudgetMissedIncomeBanner({ summary }: BudgetMissedIncomeBannerProps) {
  if (!summary) return null;

  return (
    <AccentPanel
      tone="danger"
      icon={AlertTriangle}
      title={
        <span>
          Elmaradt bevétel: <span className="tabular-nums">{formatHUF(summary.totalMissed)}</span>
        </span>
      }
      description={summary.headlineDescription}
      titleInfo={HELP.budget.missedIncome}
    >
      <div className="flex flex-col gap-2">
        <p className="text-[0.7rem] text-muted-foreground">
          Lejárt, még nem befolyt bevételek összesítve ({summary.periodLabel}):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {summary.items.map((item) => (
            <span
              key={`${item.transactionId}-${item.dueDate}`}
              className="inline-flex flex-col gap-0.5 rounded-md bg-card border border-border px-2 py-1.5 text-[0.7rem] shadow-sm min-w-[8rem]"
            >
              <span className="font-medium text-foreground">{item.monthLabel}</span>
              <span className="text-muted-foreground truncate max-w-[12rem]" title={item.description}>
                {item.description || item.category}
              </span>
              <span className="font-semibold tabular-nums text-destructive">{formatHUF(item.amount)}</span>
            </span>
          ))}
        </div>
      </div>
    </AccentPanel>
  );
}

export function DashboardMissedIncomeBanner({ summary }: BudgetMissedIncomeBannerProps) {
  if (!summary) return null;

  return (
    <AccentPanel
      tone="danger"
      icon={AlertTriangle}
      title="Elmaradt bevétel"
      description={`${summary.headlineDescription} Összesen: ${formatHUF(summary.totalMissed)}.`}
      titleInfo={HELP.budget.missedIncome}
      action={
        <Link
          href="/budget"
          className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          Költségvetés <ChevronRight size={11} />
        </Link>
      }
    >
      <span className="tabular-nums text-lg font-semibold text-destructive">
        {formatHUF(summary.totalMissed)}
      </span>
    </AccentPanel>
  );
}
