'use client';

import { useEffect, useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { AccentPanel } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import { aiFeatureLabel } from '@/config/ai-features';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import { ensureCostReductionLoaded } from '@/helpers/budget-ai-loader';
import { useAuthStore } from '@/stores/useAuthStore';
import type { AiCostReduction } from '@/types/ai';
import { Button } from '@/components/ui/button';

type Props = {
  year: number;
  month: number;
  walletId?: number | null;
  compact?: boolean;
  enabled?: boolean;
};

type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

const PREVIEW_COUNT = 3;

export function BudgetCostReductionPanel({
  year,
  month,
  walletId,
  compact = false,
  enabled = true,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const { allowed: canUseAi } = useTierFeature('ai');
  const platformEnabled = isPlatformFeatureEnabled(user, 'enable_ai_cost_reduction');
  const [data, setData] = useState<AiCostReduction | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!enabled || !canUseAi || !platformEnabled || walletId == null) {
      if (!enabled) setState('idle');
      return;
    }

    let cancelled = false;
    setState('loading');
    void ensureCostReductionLoaded(walletId, year, month)
      .then((payload) => {
        if (cancelled) return;
        if (!payload) {
          setState('error');
          return;
        }
        setData(payload);
        setState((payload.suggestions?.length ?? 0) > 0 ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [canUseAi, enabled, platformEnabled, year, month, walletId]);

  if (!platformEnabled) return null;

  if (!canUseAi) {
    if (compact) return null;
    return (
      <TierGatedAiPanel
        featureLabel={aiFeatureLabel('cost_reduction')}
        icon={PiggyBank}
        title={aiFeatureLabel('cost_reduction')}
        description="Spórolási lehetőségek"
      >
        {null}
      </TierGatedAiPanel>
    );
  }

  if (!enabled || state === 'idle') {
    return compact ? (
      <p className="text-xs text-muted-foreground py-1">Spórolási javaslatok megnyitáskor töltődnek.</p>
    ) : null;
  }

  if (state === 'loading') {
    return compact ? (
      <p className="text-xs text-muted-foreground py-1">{aiFeatureLabel('cost_reduction')} betöltése…</p>
    ) : null;
  }

  if (state === 'error' || state === 'empty' || !data?.suggestions?.length) {
    if (compact) {
      return (
        <p className="text-xs text-muted-foreground">
          {aiFeatureLabel('cost_reduction')}:{' '}
          {state === 'empty' ? 'nincs elég kifizetett kiadás a javaslathoz.' : 'nem elérhető.'}
        </p>
      );
    }
    if (state === 'error') {
      return (
        <AccentPanel tone="warning" icon={PiggyBank} title={aiFeatureLabel('cost_reduction')}>
          <p className="text-sm text-muted-foreground">A javaslatok betöltése nem sikerült.</p>
        </AccentPanel>
      );
    }
    return null;
  }

  const visible = expanded ? data.suggestions : data.suggestions.slice(0, PREVIEW_COUNT);
  const hasMore = data.suggestions.length > PREVIEW_COUNT;

  const list = (
    <>
      <ul className="space-y-1 text-xs sm:text-sm list-disc pl-4">
        {visible.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {hasMore && compact ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs mt-1" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Kevesebb' : `Még ${data.suggestions.length - PREVIEW_COUNT} javaslat`}
        </Button>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <div className="rounded-lg border border-border/80 bg-muted/15 px-3 py-2.5">
        <p className="text-xs font-semibold text-foreground mb-1.5">{aiFeatureLabel('cost_reduction')}</p>
        {list}
      </div>
    );
  }

  return (
    <AccentPanel tone="success" icon={PiggyBank} title={aiFeatureLabel('cost_reduction')}>
      {list}
    </AccentPanel>
  );
}
