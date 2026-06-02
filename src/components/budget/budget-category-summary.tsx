import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { HELP } from '@/config/help';
import { ProgressBar, SectionPanel } from '@/components/design';
import { Tag } from 'lucide-react';

type CategoryRow = { name: string; value: number };

type BudgetCategorySummaryProps = {
  categoryData: CategoryRow[];
  totalProjectedExpense: number;
  categoryColor?: (name: string) => string | undefined;
};

export function BudgetCategorySummary({
  categoryData,
  totalProjectedExpense,
  categoryColor,
}: BudgetCategorySummaryProps) {
  const maxValue = categoryData.length > 0 ? Math.max(...categoryData.map((d) => d.value)) : 0;

  return (
    <SectionPanel
      title="Kategória összegzés"
      info={HELP.budget.categorySummary}
      description="Tárgyhavi kiadások"
      icon={Tag}
      tone="primary"
      noPadding
      className="shadow-soft h-fit"
    >
      {categoryData.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6 px-4">Még nincs adat.</p>
      ) : (
        <>
          {categoryData.map((c, i) => {
            const color = categoryColor?.(c.name);
            return (
            <div
              key={c.name}
              className={classNames('px-4 py-3 group hover:bg-muted/30 transition-colors', i > 0 && 'border-t border-border')}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
                  <span
                    className={classNames('h-1.5 w-1.5 rounded-full shrink-0', !color && 'bg-primary')}
                    style={color ? { backgroundColor: color } : undefined}
                  />
                  {c.name}
                </span>
                <span className="text-xs font-semibold tabular-nums text-foreground">{formatHUF(c.value)}</span>
              </div>
              <ProgressBar
                value={c.value}
                max={maxValue}
                tone="gradient"
                barStyle={color ? { backgroundColor: color } : undefined}
              />
            </div>
          );
          })}
          <div className="flex justify-between items-center px-4 py-3 border-t-2 border-border bg-muted/40">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider">Összesen</span>
            <span className="text-sm font-semibold text-primary tabular-nums">{formatHUF(totalProjectedExpense)}</span>
          </div>
        </>
      )}
    </SectionPanel>
  );
}
