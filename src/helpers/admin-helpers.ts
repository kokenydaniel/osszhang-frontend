import type { FeatureFlag, SystemAnnouncementType } from '@/types/admin';

export function formatFeatureFlagLabel(key: string): string {
  switch (key) {
    case 'enable_ai_cfo':
      return 'AI CFO Tanácsadó';
    case 'enable_ai_travel_planner':
      return 'AI Utazás Tervező';
    case 'beta_mode':
      return 'Béta üzemmód';
    default:
      return key.replace(/_/g, ' ');
  }
}

export function formatAnnouncementTypeLabel(type: SystemAnnouncementType): string {
  switch (type) {
    case 'info':
      return 'Információ';
    case 'warning':
      return 'Figyelmeztetés';
    case 'danger':
      return 'Veszély / Sürgős';
    default:
      return type;
  }
}

export function featureFlagsToRecord(flags: FeatureFlag[]): Record<string, FeatureFlag> {
  const record: Record<string, FeatureFlag> = {};
  for (const flag of flags) {
    record[flag.key] = flag;
  }
  return record;
}

export function formatTierLabel(tier: string | undefined): string {
  switch (tier) {
    case 'premium':
      return 'Premium';
    case 'pro':
      return 'Pro';
    default:
      return 'Ingyenes';
  }
}

export function formatHouseholdRole(role: string): string {
  switch (role) {
    case 'admin':
      return 'Háztartás admin';
    case 'editor':
      return 'Szerkesztő';
    case 'viewer':
      return 'Olvasó';
    default:
      return role;
  }
}
