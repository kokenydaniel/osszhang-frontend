'use client';

import type { ReactNode, MouseEvent } from 'react';
import classNames from 'classnames';
import { TierBadge } from '@/components/subscription/TierBadge';
import { useAuthStore } from '@/stores/useAuthStore';
import { canUseFeature, requiredTierForFeature, type PremiumFeatureId } from '@/lib/checkAccess';
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
    });
  };

  return (
    <div
      className={classNames('relative rounded-lg', className)}
      onClick={handleLockedClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleLockedClick(e as unknown as MouseEvent);
      }}
      aria-label={`${featureLabel} — ${tier === 'premium' ? 'Premium' : 'Pro'} csomag szükséges`}
    >
      <div className="pointer-events-none opacity-50 select-none">{children}</div>
      <div className={classNames('absolute top-2 right-2 z-10 pointer-events-none', badgeClassName)}>
        <TierBadge tier={tier === 'premium' ? 'premium' : 'pro'} />
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
    });
  };

  return { allowed, tier, promptUpgrade };
}
