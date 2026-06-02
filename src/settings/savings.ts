import config from '@/config/config';
import { pickList } from '@/utils/pick-list';

export type SavingsSettings = {
  owners: string[];
  default_owner: string;
  separate_owner: string;
  currencies: string[];
  default_count_in_savings: boolean;
};

export const DEFAULT_SAVINGS_SETTINGS: SavingsSettings = { ...config.moduleDefaults.savings };

type HouseholdLike = {
  savings_settings?: SavingsSettings;
  savingsSettings?: SavingsSettings;
};

export function resolveSavingsSettings(household?: HouseholdLike | null): SavingsSettings {
  const raw = household?.savings_settings ?? household?.savingsSettings;
  if (!raw) return { ...DEFAULT_SAVINGS_SETTINGS };

  const owners = pickList(raw.owners, DEFAULT_SAVINGS_SETTINGS.owners);
  let defaultOwner = (raw.default_owner ?? DEFAULT_SAVINGS_SETTINGS.default_owner).trim();
  if (defaultOwner && !owners.includes(defaultOwner)) {
    defaultOwner = owners[0] ?? '';
  } else if (!defaultOwner && owners.length > 0) {
    defaultOwner = owners[0];
  }

  return {
    owners,
    default_owner: defaultOwner,
    separate_owner: (raw.separate_owner ?? DEFAULT_SAVINGS_SETTINGS.separate_owner).trim(),
    currencies: pickList(raw.currencies, DEFAULT_SAVINGS_SETTINGS.currencies),
    default_count_in_savings: raw.default_count_in_savings ?? DEFAULT_SAVINGS_SETTINGS.default_count_in_savings,
  };
}

export function savingsSettingsForApi(settings: SavingsSettings): SavingsSettings {
  const owners = pickList(settings.owners, DEFAULT_SAVINGS_SETTINGS.owners);
  const defaultOwner =
    settings.default_owner.trim() || owners[0] || DEFAULT_SAVINGS_SETTINGS.default_owner || 'Közös';

  return {
    ...settings,
    owners,
    default_owner: defaultOwner,
    separate_owner: settings.separate_owner.trim(),
  };
}

export function buildOnboardingSavingsSettings(separateGroupName?: string): SavingsSettings {
  const separateOwner = separateGroupName?.trim() ?? '';
  const owners = ['Közös'];
  if (separateOwner && !owners.includes(separateOwner)) {
    owners.push(separateOwner);
  }

  return savingsSettingsForApi({
    ...DEFAULT_SAVINGS_SETTINGS,
    owners,
    default_owner: 'Közös',
    separate_owner: separateOwner,
  });
}
