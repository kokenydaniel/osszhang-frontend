'use client';

import { Check, Sparkles, Star } from 'lucide-react';
import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/subscription/TierBadge';
import { BillingIntervalToggle } from '@/components/subscription/BillingIntervalToggle';
import { FREE_TIER_BULLETS, tierBenefitBullets } from '@/config/billing/tier-benefits';
import {
  formatPlanPrice,
  formatPlanPriceSubline,
  PAID_PLANS,
  type BillingInterval,
} from '@/config/billing/subscription-plans';
import { formatHUF } from '@/utils';
import type { SubscriptionTier } from '@/types';

interface SubscriptionPlanCardsProps {
  currentTier: SubscriptionTier;
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
  onSelectPlan: (priceId: string) => void;
  loadingPriceId?: string | null;
  showFreePlan?: boolean;
}

function planIcon(tier: 'pro' | 'premium') {
  if (tier === 'premium') {
    return <Star size={18} className="text-violet-500 fill-current" />;
  }
  return <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />;
}

function tierRank(tier: SubscriptionTier): number {
  if (tier === 'premium') return 2;
  if (tier === 'pro') return 1;
  return 0;
}

export function SubscriptionPlanCards({
  currentTier,
  interval,
  onIntervalChange,
  onSelectPlan,
  loadingPriceId = null,
  showFreePlan = true,
}: SubscriptionPlanCardsProps) {
  const currentRank = tierRank(currentTier);

  return (
      <div className="space-y-6">
      <div className="space-y-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">Válassz csomagot</h3>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            Havi vagy éves számlázás — bármikor módosítható a Stripe ügyfélkapun. A Pro az ingyenes
            csomaghoz képest ad modulokat és privát kasszákat; a Premium a Pro-hoz képest AI-t és vállalkozás
            funkciókat.
          </p>
        </div>
        <BillingIntervalToggle value={interval} onChange={onIntervalChange} />
      </div>

      <div
        className={classNames(
          'grid gap-4',
          showFreePlan ? 'md:grid-cols-3' : 'md:grid-cols-2',
        )}
      >
        {showFreePlan && (
          <div
            className={classNames(
              'relative flex flex-col rounded-2xl border p-5 transition-shadow',
              currentTier === 'free'
                ? 'border-border bg-muted/30 ring-2 ring-primary/20'
                : 'border-border bg-card',
            )}
          >
            {currentTier === 'free' && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                Jelenlegi
              </span>
            )}
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-foreground">Ingyenes</h4>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {formatHUF(0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">örökre ingyenes</p>
            </div>
            <ul className="flex-1 space-y-2 mb-5">
              {FREE_TIER_BULLETS.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" disabled className="w-full">
              {currentTier === 'free' ? 'Aktív csomag' : 'Alapcsomag'}
            </Button>
          </div>
        )}

        {PAID_PLANS.map((plan) => {
          const isCurrent = currentTier === plan.id;
          const isBelowCurrent = tierRank(plan.id) <= currentRank;
          const pricing = plan.pricing[interval];
          const subline = formatPlanPriceSubline(plan.id, interval);
          const isPremium = plan.id === 'premium';
          const planFeatures =
            plan.id === 'premium' && currentTier === 'pro'
              ? tierBenefitBullets('premium', { currentTier: 'pro' })
              : plan.features;

          return (
            <div
              key={plan.id}
              className={classNames(
                'relative flex flex-col rounded-2xl border p-5 transition-shadow',
                plan.highlighted && !isPremium
                  ? 'border-amber-500/35 bg-gradient-to-b from-amber-500/[0.06] to-card shadow-md shadow-amber-500/5'
                  : isPremium
                    ? 'border-violet-500/35 bg-gradient-to-b from-violet-500/[0.06] to-card shadow-md shadow-violet-500/5'
                    : 'border-border bg-card',
                isCurrent && 'ring-2 ring-primary/25',
              )}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                  Jelenlegi
                </span>
              )}
              {!isCurrent && plan.highlighted && currentTier === 'free' && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-amber-500 px-2.5 py-0.5 text-[0.65rem] font-semibold text-white">
                  Népszerű
                </span>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2">
                  {planIcon(plan.id)}
                  <h4 className="text-lg font-semibold text-foreground">{plan.name}</h4>
                  <TierBadge tier={plan.id} />
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatPlanPrice(plan.id, interval)}
                </p>
                {subline ? (
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">{subline}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">havonta számlázva</p>
                )}
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{plan.tagline}</p>
              </div>

              <ul className="flex-1 space-y-2 mb-5">
                {planFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <span
                      className={classNames(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        isPremium ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                      )}
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant={plan.highlighted && currentTier === 'free' ? 'default' : isPremium ? 'default' : 'outline'}
                size="lg"
                className={classNames(
                  'w-full min-h-11 h-auto whitespace-normal py-3 text-center leading-snug',
                  isPremium && !isCurrent && 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500',
                )}
                disabled={isCurrent || (isBelowCurrent && !isCurrent)}
                loading={loadingPriceId === pricing.priceId}
                onClick={() => onSelectPlan(pricing.priceId)}
              >
                {isCurrent
                  ? 'Aktív csomag'
                  : isBelowCurrent
                    ? 'Alacsonyabb csomag'
                    : `Előfizetés — ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
