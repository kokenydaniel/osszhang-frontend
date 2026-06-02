'use client';

import { Switch } from '@/components/ui/switch';
import { TierBadge } from '@/components/subscription/TierBadge';
import { featureUpgradeContext } from '@/config/billing/tier-benefits';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import type { PremiumFeatureId } from '@/helpers/check-access';

interface TierFeatureSwitchRowProps {
  feature: PremiumFeatureId;
  featureLabel: string;
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function TierFeatureSwitchRow({
  feature,
  featureLabel,
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: TierFeatureSwitchRowProps) {
  const { allowed, tier, promptUpgrade } = useTierFeature(feature);
  const badgeTier = tier === 'premium' ? 'premium' : 'pro';

  return (
    <div
      className={[
        'flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {!allowed ? <TierBadge tier={badgeTier} /> : null}
        </div>
        {description ? (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        ) : null}
        {!allowed ? (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{featureUpgradeContext(feature)}</p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => {
          if (!allowed && next) {
            promptUpgrade(featureLabel);
            return;
          }
          onCheckedChange(next);
        }}
        aria-label={title}
        className="shrink-0 mt-0.5"
      />
    </div>
  );
}
