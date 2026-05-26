import type { FeatureFlag } from '@/types/admin';

export interface RawFeatureFlag {
  key: string;
  value: boolean;
  description?: string | null;
}

export interface RawFeatureFlagsResponse {
  data: RawFeatureFlag[];
}

export function mapFeatureFlagFromApi(raw: RawFeatureFlag): FeatureFlag {
  return {
    key: raw.key,
    value: Boolean(raw.value),
    description: raw.description ?? null,
  };
}

export function mapFeatureFlagsFromApi(raw: RawFeatureFlag[]): FeatureFlag[] {
  return raw.map(mapFeatureFlagFromApi);
}

export function featureFlagsToRecord(flags: FeatureFlag[]): Record<string, FeatureFlag> {
  return Object.fromEntries(flags.map((flag) => [flag.key, flag]));
}

export function formatFeatureFlagLabel(key: string): string {
  switch (key) {
    case 'maintenance_mode':
      return 'Karbantartási mód';
    case 'global_ai_search':
      return 'Globális AI keresés';
    case 'beta_mode':
      return 'Béta mód';
    case 'enable_ai_cfo':
      return 'AI CFO asszisztens';
    case 'enable_ai_travel_planner':
      return 'AI utazástervező';
    default:
      return key.replace(/_/g, ' ');
  }
}
