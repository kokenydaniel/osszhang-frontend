'use client';

import type { ReactNode, MouseEvent } from 'react';
import classNames from 'classnames';
import { TierBadge } from '@/components/subscription/TierBadge';
import { useAuthStore } from '@/stores/useAuthStore';
import { featureUpgradeContext } from '@/config/billing/tier-benefits';
import { canUseFeature, effectiveTier, requiredTierForFeature, type PremiumFeatureId } from '@/helpers/check-access';
import { openUpgradeModal } from '@/stores/useUpgradeModalStore';

interface TierFeatureGateProps {
  feature: PremiumFeatureId;
  featureLabel: string;
  children: ReactNode;
  className?: string;
  badgeClassName?: string;
}

export function TierFeatureGate({
  feature,
  featureLabel,
  children,
  className,
  badgeClassName,
}: TierFeatureGateProps) {
  const user = useAuthStore((s) => s.user);
  const allowed = canUseFeature(user, feature);
  const tier = requiredTierForFeature(feature);

  if (allowed) {
    return <>{children}</>;
  }

  const handleLockedClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openUpgradeModal({
      requiredTier: tier === 'premium' ? 'premium' : 'pro',
      featureLabel,
      featureId: feature,
    });
  };

  const paidTier = tier === 'premium' ? 'premium' : 'pro';

  return (
    <div
      className={classNames('rounded-lg border border-dashed border-border/80', className)}
      onClick={handleLockedClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleLockedClick(e as unknown as MouseEvent);
      }}
      aria-label={`${featureLabel} — ${tier === 'premium' ? 'Premium' : 'Pro'} csomag szükséges`}
    >
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start gap-3">
          <div className="pointer-events-none min-w-0 flex-1 opacity-50 select-none">{children}</div>
          <div className={classNames('shrink-0 self-start pointer-events-none', badgeClassName)}>
            <TierBadge tier={paidTier} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{featureUpgradeContext(feature)}</p>
      </div>
    </div>
  );
}

export function useTierFeature(feature: PremiumFeatureId) {
  const user = useAuthStore((s) => s.user);
  const allowed = canUseFeature(user, feature);
  const tier = requiredTierForFeature(feature);

  const promptUpgrade = (featureLabel: string) => {
    openUpgradeModal({
      requiredTier: tier === 'premium' ? 'premium' : 'pro',
      featureLabel,
      featureId: feature,
    });
  };

  return { allowed, tier, promptUpgrade };
}
