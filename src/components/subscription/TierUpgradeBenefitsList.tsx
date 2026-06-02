'use client';

import { Check } from 'lucide-react';
import classNames from 'classnames';
import {
  tierBenefitBullets,
  tierUpgradeIntro,
  type PaidTier,
} from '@/config/billing/tier-benefits';
import type { SubscriptionTier } from '@/types';

interface TierUpgradeBenefitsListProps {
  tier: PaidTier;
  currentTier?: SubscriptionTier | null;
  className?: string;
  introClassName?: string;
  bulletClassName?: string;
  checkClassName?: string;
}

export function TierUpgradeBenefitsList({
  tier,
  currentTier,
  className,
  introClassName,
  bulletClassName,
  checkClassName,
}: TierUpgradeBenefitsListProps) {
  const intro = tierUpgradeIntro(tier, currentTier);
  const bullets = tierBenefitBullets(tier, { currentTier });
  const isPremium = tier === 'premium';

  return (
    <div className={classNames('space-y-3', className)}>
      <p className={classNames('text-sm text-muted-foreground leading-relaxed', introClassName)}>{intro}</p>
      <ul className="space-y-2.5">
        {bullets.map((item) => (
          <li key={item} className={classNames('flex items-start gap-2.5 text-sm text-foreground', bulletClassName)}>
            <span
              className={classNames(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                isPremium ? 'bg-violet-500/12 text-violet-600 dark:text-violet-400' : 'bg-primary/12 text-primary',
                checkClassName,
              )}
            >
              <Check size={12} strokeWidth={2.5} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
