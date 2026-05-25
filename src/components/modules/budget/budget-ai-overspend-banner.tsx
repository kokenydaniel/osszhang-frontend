import { formatHUF } from '@/utils';
import { HELP } from '@/lib/helpTexts';
import { AccentPanel } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import { Bot, Tag } from 'lucide-react';
import type { BudgetPageState } from '@/components/modules/budget/hooks/use-budget-page-state';

type BudgetAiOverspendBannerProps = Pick<BudgetPageState, 'aiOverspend'>;

export function BudgetAiOverspendBanner({ aiOverspend }: BudgetAiOverspendBannerProps) {
  const { allowed: canUseAi } = useTierFeature('ai');

  if (!canUseAi) {
    return (
      <TierGatedAiPanel
        featureLabel="AI túlköltés figyelő"
        icon={Bot}
        title="AI túlköltés ellenőrzés"
        titleInfo={HELP.budget.aiOverspend}
        description="Modell alapú elemzés a tárgyhavi költésekről"
      >
        {null}
      </TierGatedAiPanel>
    );
  }

  if (!aiOverspend) return null;

  return (
    <AccentPanel
      tone={aiOverspend.status === 'overspent' ? 'warning' : 'success'}
      icon={Bot}
      title={
        aiOverspend.status === 'overspent' ? (
          <span>
            AI túlköltés érzékelve:{' '}
            {typeof aiOverspend.overspend_amount === 'number' ? formatHUF(aiOverspend.overspend_amount) : ''}
          </span>
        ) : (
          'AI túlköltés ellenőrzés: rendben'
        )
      }
      description="Modell alapú elemzés a tárgyhavi költésekről"
      titleInfo={HELP.budget.aiOverspend}
    >
      {!!aiOverspend.top_drivers?.length && (
        <div className="flex flex-wrap gap-1.5">
          {aiOverspend.top_drivers.map((d: { category: string; amount: number }) => (
            <span
              key={d.category}
              className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[0.7rem] shadow-sm"
            >
              <Tag size={9} strokeWidth={2.2} className="text-muted-foreground" />
              <span className="text-muted-foreground">{d.category}:</span>
              <span className="font-semibold tabular-nums text-foreground">{formatHUF(d.amount)}</span>
            </span>
          ))}
        </div>
      )}
    </AccentPanel>
  );
}
