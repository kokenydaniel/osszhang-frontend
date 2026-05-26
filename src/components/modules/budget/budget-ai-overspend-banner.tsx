import { formatHUF } from '@/utils';
import { HELP } from '@/lib/helpTexts';
import { AccentPanel } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import { Bot, Tag } from 'lucide-react';
import type { BudgetLogicResult } from '@/components/modules/budget/hooks/useBudgetLogic';

type BudgetAiOverspendBannerProps = Pick<BudgetLogicResult, 'aiOverspend'>;

function buildDescription(aiOverspend: NonNullable<BudgetLogicResult['aiOverspend']>): string {
  const income = aiOverspend.income_received;
  const spent = aiOverspend.spent_this_month;
  const balance = aiOverspend.monthly_balance;

  if (typeof income === 'number' && typeof spent === 'number' && typeof balance === 'number') {
    return `Befolyt bevétel ${formatHUF(income)} − kifizetett kiadások ${formatHUF(spent)} = havi egyenleg ${formatHUF(balance)}.`;
  }

  if (typeof balance === 'number') {
    return `Havi egyenleg (befolyt bevétel − kifizetett kiadások): ${formatHUF(balance)}.`;
  }

  return 'A túlköltés a havi egyenleg negatív értékéből számolódik — ugyanabból a logikából, mint a „Havi egyenleg” statisztika alatt.';
}

export function BudgetAiOverspendBanner({ aiOverspend }: BudgetAiOverspendBannerProps) {
  const { allowed: canUseAi } = useTierFeature('ai');

  if (!canUseAi) {
    return (
      <TierGatedAiPanel
        featureLabel="AI túlköltés figyelő"
        icon={Bot}
        title="AI túlköltés ellenőrzés"
        titleInfo={HELP.budget.aiOverspend}
        description="Befolyt bevétel és kifizetett kiadások összehasonlítása"
      >
        {null}
      </TierGatedAiPanel>
    );
  }

  if (!aiOverspend) return null;

  const isOverspent = aiOverspend.status === 'overspent' && aiOverspend.overspend_amount > 0;
  const description = buildDescription(aiOverspend);

  return (
    <AccentPanel
      tone={isOverspent ? 'warning' : 'success'}
      icon={Bot}
      title={
        isOverspent ? (
          <span>
            Havi túlköltés:{' '}
            {typeof aiOverspend.overspend_amount === 'number' ? formatHUF(aiOverspend.overspend_amount) : ''}
          </span>
        ) : (
          'Nincs túlköltés ebben a hónapban'
        )
      }
      description={description}
      titleInfo={HELP.budget.aiOverspend}
    >
      {!!aiOverspend.top_drivers?.length && (
        <div className="flex flex-col gap-2">
          <p className="text-[0.7rem] text-muted-foreground">
            {isOverspent ? 'Legnagyobb kiadási kategóriák:' : 'Top kiadások ebben a hónapban:'}
          </p>
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
        </div>
      )}
    </AccentPanel>
  );
}
