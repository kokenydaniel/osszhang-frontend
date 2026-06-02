import type { ModuleId } from '@/config/config';
import type { PremiumFeatureId } from '@/config/subscription';

export type TierGuardedModuleRoute = {
  prefix: string;
  moduleId: ModuleId;
};

export type TierGuardedFeatureRoute = {
  prefix: string;
  featureId: PremiumFeatureId;
  featureLabel: string;
};

/** Dashboard paths that require Pro or Premium (mirrors backend `tier.module` groups). */
export const tierGuardedModuleRoutes: TierGuardedModuleRoute[] = [
  { prefix: '/savings', moduleId: 'savings' },
  { prefix: '/debts', moduleId: 'debts' },
  { prefix: '/utilities', moduleId: 'utilities' },
  { prefix: '/meters', moduleId: 'meters' },
  { prefix: '/business', moduleId: 'business' },
];

/** Premium feature routes without a dedicated module id. */
export const tierGuardedFeatureRoutes: TierGuardedFeatureRoute[] = [
  { prefix: '/tools/travel', featureId: 'ai', featureLabel: 'AI Utazástervező' },
];
