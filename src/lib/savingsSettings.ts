export type SavingsSettings = {
  owners: string[];
  default_owner: string;
  separate_owner: string;
  currencies: string[];
  default_count_in_savings: boolean;
};

export const DEFAULT_SAVINGS_SETTINGS: SavingsSettings = {
  owners: [],
  default_owner: '',
  separate_owner: '',
  currencies: ['HUF', 'EUR', 'USD'],
  default_count_in_savings: true,
};

type HouseholdLike = {
  savings_settings?: SavingsSettings;
  savingsSettings?: SavingsSettings;
};

function pickList(list: string[] | undefined, fallback: string[]): string[] {
  if (list === undefined) {
    return [...fallback];
  }
  const clean = list.map((s) => s.trim()).filter(Boolean);
  return [...new Set(clean)];
}

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
