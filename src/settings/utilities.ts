import config from '@/config/config';

export type UtilitiesSettings = {
  clone_from_previous_month: boolean;
  settlement_auto_suggest: boolean;
  default_payer_user_id: number | null;
};

export const DEFAULT_UTILITIES_SETTINGS: UtilitiesSettings = { ...config.moduleDefaults.utilities };

type HouseholdLike = {
  utilities_settings?: UtilitiesSettings;
  utilitiesSettings?: UtilitiesSettings;
};

export function resolveUtilitiesSettings(household?: HouseholdLike | null): UtilitiesSettings {
  const raw = household?.utilities_settings ?? household?.utilitiesSettings;
  if (!raw) return { ...DEFAULT_UTILITIES_SETTINGS };

  const payer = raw.default_payer_user_id;
  const payerId =
    payer === null || payer === undefined ? null : Number(payer);

  return {
    clone_from_previous_month:
      raw.clone_from_previous_month ?? DEFAULT_UTILITIES_SETTINGS.clone_from_previous_month,
    settlement_auto_suggest:
      raw.settlement_auto_suggest ?? DEFAULT_UTILITIES_SETTINGS.settlement_auto_suggest,
    default_payer_user_id: payerId && Number.isFinite(payerId) && payerId > 0 ? payerId : null,
  };
}
