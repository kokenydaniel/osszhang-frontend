'use client';

import Link from 'next/link';
import { Check, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { BillingIntervalToggle } from '@/components/subscription/BillingIntervalToggle';
import { useUpgradeModal } from '@/stores/useUpgradeModalStore';
import { tierLabel } from '@/lib/checkAccess';
import {
  formatPlanPrice,
  formatPlanPriceSubline,
  planPriceId,
  type BillingInterval,
} from '@/lib/subscriptionPlans';
import { redirectToStripeCheckout } from '@/lib/stripeCheckout';
import { useNotificationStore } from '@/stores/useNotificationStore';

const PRO_FEATURES = [
  'Korlátlan privát kassza',
  'Megtakarítások és tartozások',
  'Rezsi és közműóra modul',
  'Rezsimegosztás partnerekkel',
];

const PREMIUM_FEATURES = [
  'Minden Pro funkció',
  'Shopify rendelés import',
  'AI pénzügyi tanácsadó',
  'Automatikus kategorizálás',
];

export function UpgradeModal() {
  const { isOpen, requiredTier, featureLabel, closeUpgradeModal } = useUpgradeModal();
  const { addNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const isPremium = requiredTier === 'premium';
  const features = isPremium ? PREMIUM_FEATURES : PRO_FEATURES;
  const tierName = tierLabel(requiredTier);
  const priceSubline = formatPlanPriceSubline(requiredTier, billingInterval);

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
      description={
        featureLabel
          ? `A(z) „${featureLabel}” funkció a magasabb csomagban érhető el.`
          : `Válts ${tierName} csomagra a teljes élményért.`
      }
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
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
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
        </div>

        <ul className="space-y-2.5">
          {features.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Check size={12} strokeWidth={2.5} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

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
              Összes csomag
            </Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
