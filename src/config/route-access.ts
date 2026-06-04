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
  { prefix: '/pocket-money', moduleId: 'pocket_money' },
  { prefix: '/insurance', moduleId: 'insurance' },
  { prefix: '/rental', moduleId: 'rental' },
  { prefix: '/receivables', moduleId: 'receivables' },
  { prefix: '/savings', moduleId: 'savings' },
  { prefix: '/debts', moduleId: 'debts' },
  { prefix: '/utilities', moduleId: 'utilities' },
  { prefix: '/meters', moduleId: 'meters' },
  { prefix: '/business', moduleId: 'business' },
  { prefix: '/tools/travel', moduleId: 'travel_planner' },
];

/** Premium feature routes without a dedicated module id. */
export const tierGuardedFeatureRoutes: TierGuardedFeatureRoute[] = [];
