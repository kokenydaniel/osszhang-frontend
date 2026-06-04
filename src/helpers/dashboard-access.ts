import { canUseFeature } from '@/helpers/check-access';
import { canUseModuleWithTier, type ModuleId } from '@/helpers/module-access';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import type { DashboardWidgetId } from '@/settings/dashboard';
import type { UserProfile } from '@/types';

type CanUseModule = (mod: string) => boolean;

/** Havi pénzügyi tanácsadó: platform + Premium + költségvetés modul. */
export function canLoadDashboardAiCfo(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return (
    isPlatformFeatureEnabled(user, 'enable_ai_cfo') &&
    canUseFeature(user, 'ai') &&
    canUseModuleWithTier(user, 'budget')
  );
}

/** Közmű AI anomália lekérés. */
export function canLoadUtilityAnomalies(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return (
    isPlatformFeatureEnabled(user, 'enable_ai_utility_anomaly') &&
    canUseFeature(user, 'ai') &&
    canUseModuleWithTier(user, 'meters')
  );
}

/** Heti AI összegzés widget. */
export function canShowDashboardAiBriefing(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return (
    isPlatformFeatureEnabled(user, 'enable_ai_weekly_briefing') &&
    canUseFeature(user, 'ai') &&
    canUseModuleWithTier(user, 'budget')
  );
}

export function needsExchangeRatesOnDashboard(user: UserProfile | null | undefined): boolean {
  return canUseModuleWithTier(user, 'savings');
}

export function isDashboardContentReady(params: {
  financialDataReady: boolean;
  canUse: CanUseModule;
  activeWalletId: number | null;
}): boolean {
  const { financialDataReady, canUse, activeWalletId } = params;
  if (!financialDataReady) return false;
  if (canUse('budget')) {
    return activeWalletId !== null;
  }
  return true;
}

/** Widget sorrend: csak a felhasználó számára releváns blokkok. */
export function filterDashboardWidgetOrder(
  order: DashboardWidgetId[],
  user: UserProfile | null | undefined,
): DashboardWidgetId[] {
  if (!user) return order;

  return order.filter((id) => {
    switch (id) {
      case 'ai_cfo':
        return canLoadDashboardAiCfo(user);
      case 'ai_briefing':
        return canShowDashboardAiBriefing(user);
      case 'business_chart':
        return canUseModuleWithTier(user, 'business');
      default:
        return true;
    }
  });
}

/** @deprecated Use {@link canLoadDashboardAiCfo} */
export function shouldRenderDashboardAiCfo(user: UserProfile | null | undefined): boolean {
  return canLoadDashboardAiCfo(user);
}

export type { ModuleId };
