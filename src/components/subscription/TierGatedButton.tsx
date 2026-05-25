'use client';

import type { ComponentProps } from 'react';
import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/subscription/TierBadge';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import type { PremiumFeatureId } from '@/lib/checkAccess';

type TierGatedButtonProps = ComponentProps<typeof Button> & {
  feature: PremiumFeatureId;
  featureLabel: string;
  showBadge?: boolean;
};

export function TierGatedButton({
  feature,
  featureLabel,
  showBadge = true,
  onClick,
  disabled,
  className,
  children,
  ...props
}: TierGatedButtonProps) {
  const { allowed, tier, promptUpgrade } = useTierFeature(feature);

  return (
    <Button
      {...props}
      disabled={disabled && allowed}
      className={classNames(!allowed && 'opacity-50', className)}
      onClick={(e) => {
        if (!allowed) {
          promptUpgrade(featureLabel);
          return;
        }
        onClick?.(e);
      }}
    >
      {!allowed && showBadge && (
        <TierBadge tier={tier === 'premium' ? 'premium' : 'pro'} className="mr-1" />
      )}
      {children}
    </Button>
  );
}
