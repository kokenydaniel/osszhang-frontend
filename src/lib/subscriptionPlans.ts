import { formatHUF } from '@/utils';
import { priceIdForTier, STRIPE_PRICE_IDS } from '@/lib/stripePlans';
import type { SubscriptionTier } from '@/types';

export type BillingInterval = 'monthly' | 'yearly';

export interface PlanPricing {
  amount: number;
  priceId: string;
}

export interface SubscriptionPlanDefinition {
  id: Exclude<SubscriptionTier, 'lifetime_admin'>;
  name: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  pricing?: {
    monthly: PlanPricing;
    yearly: PlanPricing;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    id: 'free',
    name: 'Ingyenes',
    tagline: 'Egy közös kassza és alap cashflow — induláshoz ideális.',
    features: ['1 közös kassza', 'Költségvetés / cashflow', 'Háztartás kezelés'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Pároknak és összetettebb háztartásoknak.',
    highlighted: true,
    features: [
      'Korlátlan privát kassza',
      'Megtakarítás, tartozás, rezsi',
      'Rezsimegosztás',
      'Közműóra modul',
    ],
    pricing: {
      monthly: { amount: 1_490, priceId: STRIPE_PRICE_IDS.proMonthly },
      yearly: { amount: 14_900, priceId: STRIPE_PRICE_IDS.proYearly },
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Vállalkozóknak és power usereknek.',
    features: [
      'Minden Pro funkció',
      'Shopify import',
      'AI tanácsadó',
      'Automatikus kategorizálás',
    ],
    pricing: {
      monthly: { amount: 2_990, priceId: STRIPE_PRICE_IDS.premiumMonthly },
      yearly: { amount: 29_900, priceId: STRIPE_PRICE_IDS.premiumYearly },
    },
  },
];

export interface PaidSubscriptionPlan extends Omit<SubscriptionPlanDefinition, 'id' | 'pricing'> {
  id: 'pro' | 'premium';
  pricing: {
    monthly: PlanPricing;
    yearly: PlanPricing;
  };
}

export const PAID_PLANS: PaidSubscriptionPlan[] = SUBSCRIPTION_PLANS.filter(
  (plan): plan is PaidSubscriptionPlan => plan.id === 'pro' || plan.id === 'premium',
);

export function getPlanById(id: SubscriptionTier): SubscriptionPlanDefinition | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}

export function planPriceId(tier: 'pro' | 'premium', interval: BillingInterval): string {
  return priceIdForTier(tier, interval);
}

export function planPriceAmount(tier: 'pro' | 'premium', interval: BillingInterval): number {
  const plan = getPlanById(tier);
  return plan?.pricing?.[interval]?.amount ?? 0;
}

export function formatPlanPrice(tier: 'pro' | 'premium', interval: BillingInterval): string {
  const amount = planPriceAmount(tier, interval);
  if (interval === 'yearly') {
    return `${formatHUF(amount)} / év`;
  }
  return `${formatHUF(amount)} / hó`;
}

export function formatPlanPriceSubline(tier: 'pro' | 'premium', interval: BillingInterval): string | null {
  if (interval !== 'yearly') return null;
  const yearly = planPriceAmount(tier, 'yearly');
  const monthlyTotal = planPriceAmount(tier, 'monthly') * 12;
  const savings = monthlyTotal - yearly;
  if (savings <= 0) return null;
  const monthlyEquivalent = Math.round(yearly / 12);
  return `≈ ${formatHUF(monthlyEquivalent)} / hó · ${formatHUF(savings)} megtakarítás`;
}

export function yearlyFreeMonths(tier: 'pro' | 'premium'): number {
  const monthly = planPriceAmount(tier, 'monthly');
  const yearly = planPriceAmount(tier, 'yearly');
  if (monthly <= 0) return 0;
  return Math.max(0, 12 - Math.round(yearly / monthly));
}
