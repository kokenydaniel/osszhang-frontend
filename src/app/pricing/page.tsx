'use client';

import Link from 'next/link';
import { useState } from 'react';
import { InsightBanner, PageHeader } from '@/components/design';
import { Button } from '@/components/ui/button';
import { SubscriptionPlanCards } from '@/components/subscription/SubscriptionPlanCards';
import { APP_NAME } from '@/lib/branding';
import { isBetaMode } from '@/lib/checkAccess';
import type { BillingInterval } from '@/lib/subscriptionPlans';
import { redirectToStripeCheckout } from '@/lib/stripeCheckout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { FlaskConical } from 'lucide-react';

export default function PricingPage() {
  const user = useAuthStore((s) => s.user);
  const betaMode = isBetaMode(user);
  const { addNotification } = useNotificationStore();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const handleCheckout = async (priceId: string) => {
    if (betaMode) {
      addNotification('Béta módban a fizetés ki van kapcsolva — minden funkció elérhető.', 'info');
      return;
    }
    setLoadingPriceId(priceId);
    try {
      await redirectToStripeCheckout(priceId);
    } catch {
      addNotification('A fizetés indítása nem sikerült. Be vagy jelentkezve adminisztrátorként?', 'error');
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 md:px-8">
        <PageHeader
          title="Csomagok"
          description={`Válaszd ki, mire van szükséged az ${APP_NAME}ban. Havi vagy éves számlázás — a fizetés Stripe-on keresztül történik.`}
          breadcrumbs={[{ label: APP_NAME, href: '/' }, { label: 'Árazás' }]}
        />

        {betaMode && (
          <InsightBanner tone="info" icon={FlaskConical} title="Béta mód aktív">
            Az előfizetés jelenleg ki van kapcsolva. Minden funkció ingyenesen használható.
          </InsightBanner>
        )}

        {!betaMode && (
          <SubscriptionPlanCards
            currentTier="free"
            interval={billingInterval}
            onIntervalChange={setBillingInterval}
            onSelectPlan={(priceId) => void handleCheckout(priceId)}
            loadingPriceId={loadingPriceId}
            showFreePlan
          />
        )}

        <div className="text-center">
          <Button asChild variant="ghost">
            <Link href="/">Vissza az alkalmazásba</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
