import config from '@/config/config';
import { aiFeatureLabel } from '@/config/ai-features';

export const DASHBOARD_WIDGET_IDS = [
  'alerts',
  'ai_cfo',
  'primary_metrics',
  'secondary_metrics',
  'main_grid',
  'business_chart',
  'ai_briefing',
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export type DashboardSettings = {
  widget_order: DashboardWidgetId[];
};

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  widget_order: [...config.moduleDefaults.dashboard.widget_order],
};

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  alerts: 'Figyelmeztetések (kimaradt bevétel, rezsi)',
  ai_cfo: aiFeatureLabel('monthly_advisor'),
  primary_metrics: 'Fő mutatók',
  secondary_metrics: 'Másodlagos mutatók',
  main_grid: 'Fizetendők és oldalsáv',
  business_chart: 'Vállalkozás grafikon',
  ai_briefing: aiFeatureLabel('weekly_report'),
};

type HouseholdLike = {
  dashboard_settings?: DashboardSettings;
  dashboardSettings?: DashboardSettings;
};

export function resolveDashboardSettings(household?: HouseholdLike | null): DashboardSettings {
  const raw = household?.dashboard_settings ?? household?.dashboardSettings;
  if (!raw?.widget_order?.length) return { ...DEFAULT_DASHBOARD_SETTINGS };

  const order: DashboardWidgetId[] = [];
  for (const id of raw.widget_order) {
    if (DASHBOARD_WIDGET_IDS.includes(id as DashboardWidgetId) && !order.includes(id as DashboardWidgetId)) {
      order.push(id as DashboardWidgetId);
    }
  }
  for (const id of DASHBOARD_WIDGET_IDS) {
    if (!order.includes(id)) order.push(id);
  }

  return { widget_order: order };
}
