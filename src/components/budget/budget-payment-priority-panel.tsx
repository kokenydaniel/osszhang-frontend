'use client';

import { useEffect, useState } from 'react';
import { ListOrdered } from 'lucide-react';
import { AccentPanel } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import { aiFeatureLabel } from '@/config/ai-features';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import { aiFinanceClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { useEnsureExchangeRates } from '@/hooks/useEnsureExchangeRates';
import { formatTransactionAmount, toHuf } from '@/utils/money';
import { formatHUF } from '@/utils';
import { StatusCodes } from '@/types/api';
import type { AiPaymentPriority } from '@/types/ai';
import { Button } from '@/components/ui/button';

type Props = {
  year: number;
  month: number;
  walletId?: number | null;
  compact?: boolean;
};

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

const PREVIEW_COUNT = 3;

export function BudgetPaymentPriorityPanel({ year, month, walletId, compact = false }: Props) {
  const user = useAuthStore((s) => s.user);
  const { allowed: canUseAi } = useTierFeature('ai');
  const platformEnabled = isPlatformFeatureEnabled(user, 'enable_ai_payment_priority');
  const exchangeRates = useExchangeRatesStore((s) => s.rates);
  useEnsureExchangeRates();
  const [data, setData] = useState<AiPaymentPriority | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!canUseAi || !platformEnabled) return;
    setState('loading');
    void aiFinanceClient
      .paymentPriority({ year, month, walletId: walletId ?? undefined })
      .then((res) => {
        if (!res || res[0] !== StatusCodes.Http200) {
          setState('error');
          return;
        }
        const payload = res[1].data;
        setData(payload);
        setState(payload.items.length > 0 ? 'ready' : 'empty');
      })
      .catch(() => setState('error'));
  }, [canUseAi, platformEnabled, year, month, walletId]);

  if (!platformEnabled) return null;

  if (!canUseAi) {
    if (compact) return null;
    return (
      <TierGatedAiPanel
        featureLabel={aiFeatureLabel('payment_priority')}
        icon={ListOrdered}
        title={aiFeatureLabel('payment_priority')}
        description="Esedékes tételek rangsora"
      >
        {null}
      </TierGatedAiPanel>
    );
  }

  if (state === 'loading') {
    return compact ? (
      <p className="text-xs text-muted-foreground py-1">{aiFeatureLabel('payment_priority')} betöltése…</p>
    ) : (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {aiFeatureLabel('payment_priority')} betöltése…
      </div>
    );
  }

  if (state === 'error') {
    return compact ? (
      <p className="text-xs text-amber-700 dark:text-amber-300">{aiFeatureLabel('payment_priority')}: betöltési hiba.</p>
    ) : (
      <AccentPanel tone="warning" icon={ListOrdered} title={aiFeatureLabel('payment_priority')}>
        <p className="text-sm text-muted-foreground">A lista betöltése nem sikerült.</p>
      </AccentPanel>
    );
  }

  if (state === 'empty' || !data) {
    return compact ? (
      <p className="text-xs text-muted-foreground">{aiFeatureLabel('payment_priority')}: nincs fizetendő tétel.</p>
    ) : (
      <AccentPanel tone="info" icon={ListOrdered} title={aiFeatureLabel('payment_priority')}>
        <p className="text-sm text-muted-foreground">Nincs fizetendő tétel ehhez a kasszához.</p>
      </AccentPanel>
    );
  }

  const totalHuf = Math.round(
    data.items.reduce((sum, item) => sum + toHuf(item.amount, item.currency, exchangeRates), 0),
  );
  const visible = expanded ? data.items : data.items.slice(0, PREVIEW_COUNT);
  const hasMore = data.items.length > PREVIEW_COUNT;

  const list = (
    <>
      <ol className="space-y-1.5">
        {visible.map((item, index) => (
          <li
            key={`${item.source}-${item.id}-${index}`}
            className="flex items-start justify-between gap-2 text-xs sm:text-sm"
          >
            <span className="min-w-0">
              <span className="font-medium">{item.rank ?? index + 1}.</span> {item.label}
              {item.is_overdue ? <span className="text-rose-600"> (lejárt)</span> : null}
            </span>
            <span className="font-medium tabular-nums shrink-0 text-right">
              {formatTransactionAmount(item.amount, item.currency, exchangeRates)}
            </span>
          </li>
        ))}
      </ol>
      {hasMore && compact ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs mt-1" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Kevesebb' : `Még ${data.items.length - PREVIEW_COUNT} tétel`}
        </Button>
      ) : null}
      <p className="text-[0.65rem] text-muted-foreground mt-1">
        Összesen ≈ {formatHUF(totalHuf)} ({data.item_count} tétel, HUF árfolyamon)
      </p>
    </>
  );

  if (compact) {
    return (
      <div className="rounded-lg border border-border/80 bg-muted/15 px-3 py-2.5">
        <p className="text-xs font-semibold text-foreground mb-1.5">{aiFeatureLabel('payment_priority')}</p>
        {list}
      </div>
    );
  }

  return (
    <AccentPanel tone="info" icon={ListOrdered} title={aiFeatureLabel('payment_priority')}>
      {list}
    </AccentPanel>
  );
}
