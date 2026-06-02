'use client';

import { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Cpu, RefreshCw } from 'lucide-react';
import { AccentPanel } from '@/components/design';
import { Button } from '@/components/ui/button';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { HELP } from '@/config/help';
import { aiHelpers } from '@/helpers/ai-helpers';
import { budgetYearCalculations, type BudgetYearSnapshot } from '@/calculations/budget-year';

type BudgetYearAiPanelProps = {
  selectedYear: number;
  snapshot: BudgetYearSnapshot;
};

export function BudgetYearAiPanel({ selectedYear, snapshot }: BudgetYearAiPanelProps) {
  const [realAdvice, setRealAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fallbackAdvice = useMemo(
    () => budgetYearCalculations.buildFallbackYearAdvice(snapshot, selectedYear),
    [selectedYear, snapshot],
  );

  const requestAdvice = useCallback(async () => {
    setLoading(true);
    try {
      const answer = await aiHelpers.getStrategyAdvice(
        budgetYearCalculations.buildYearReviewPrompt(snapshot, selectedYear),
      );
      setRealAdvice(answer);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, snapshot]);

  const title = `${selectedYear}. évi pénzügyi elemzés`;

  return (
    <TierGatedAiPanel
      featureLabel="Éves AI elemzés"
      icon={Cpu}
      title={title}
      titleInfo={HELP.budget.yearAi}
      description="Személyre szabott éves összefoglaló és javaslatok"
      glow
      action={
        <TierGatedButton
          feature="ai"
          featureLabel="Éves AI elemzés"
          variant="ghost"
          size="xs"
          onClick={() => void requestAdvice()}
          disabled={loading}
        >
          <RefreshCw size={11} className={classNames(loading && 'animate-spin')} />
          {loading ? 'Elemzés…' : 'Új elemzés'}
        </TierGatedButton>
      }
    >
      <AccentPanel
        tone="ai"
        icon={Cpu}
        title={title}
        titleInfo={HELP.budget.yearAi}
        description="Személyre szabott éves összefoglaló"
        glow
        action={
          <Button variant="ghost" size="xs" onClick={() => void requestAdvice()} disabled={loading}>
            <RefreshCw size={11} className={classNames(loading && 'animate-spin')} />
            {loading ? 'Elemzés…' : 'Új elemzés'}
          </Button>
        }
      >
        {loading ? 'Az éves adatok elemzése folyamatban…' : realAdvice || fallbackAdvice}
      </AccentPanel>
    </TierGatedAiPanel>
  );
}
