'use client';

import Link from 'next/link';
import { Sparkles, Star } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { BillingIntervalToggle } from '@/components/subscription/BillingIntervalToggle';
import { TierUpgradeBenefitsList } from '@/components/subscription/TierUpgradeBenefitsList';
import { useUpgradeModal } from '@/stores/useUpgradeModalStore';
import { Card } from '@/components/ui/card';
import { effectiveTier, tierLabel } from '@/helpers/check-access';
import { upgradeModalDescription } from '@/config/billing/tier-benefits';
import {
  formatPlanPrice,
  formatPlanPriceSubline,
  planPriceId,
  type BillingInterval,
} from '@/config/billing/subscription-plans';
import { redirectToStripeCheckout } from '@/helpers/stripe-checkout';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';

export function UpgradeModal() {
  const { isOpen, requiredTier, featureLabel, featureId, moduleId, closeUpgradeModal } = useUpgradeModal();
  const user = useAuthStore((s) => s.user);
  const { addNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const isPremium = requiredTier === 'premium';
  const tierName = tierLabel(requiredTier);
  const priceSubline = formatPlanPriceSubline(requiredTier, billingInterval);
  const currentTier = effectiveTier(user);

  const description = upgradeModalDescription(requiredTier, {
    featureLabel,
    currentTier,
    featureId: featureId ?? undefined,
    moduleId: moduleId ?? undefined,
  });

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await redirectToStripeCheckout(planPriceId(requiredTier, billingInterval));
    } catch {
      addNotification('A fizetés indítása nem sikerült.', 'error');
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeUpgradeModal}
      title={`Ez a funkció a ${tierName} csomag része`}
      description={description}
      icon={
        isPremium ? (
          <Star size={20} className="fill-current" />
        ) : (
          <Sparkles size={20} />
        )
      }
      size="sm"
    >
      <div className="flex flex-col gap-5">
        <Card className="rounded-xl bg-muted/20 shadow-none p-4 space-y-4 border border-border">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{tierName} csomag</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
              {formatPlanPrice(requiredTier, billingInterval)}
            </p>
            {priceSubline && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">{priceSubline}</p>
            )}
          </div>
          <div className="flex justify-start">
            <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} />
          </div>
        </Card>

        <TierUpgradeBenefitsList tier={requiredTier} currentTier={currentTier} />

        <div className="flex flex-col gap-2.5 pt-1">
          <Button
            size="lg"
            className="w-full min-h-11 h-auto whitespace-normal py-3 text-center leading-snug"
            loading={loading}
            onClick={() => void handleUpgrade()}
          >
            Előfizetés — {tierName}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full min-h-10 h-auto whitespace-normal py-2.5 text-center leading-snug"
            asChild
          >
            <Link href="/pricing" onClick={closeUpgradeModal}>
              Összes csomag összehasonlítása
            </Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
