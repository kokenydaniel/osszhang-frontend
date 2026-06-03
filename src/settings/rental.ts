import config from '@/config/config';

export type RentalSettings = {
  currencies: string[];
  default_currency: string;
  contract_reminder_days_before: number;
  overdue_grace_days: number;
  budget_sync_default: boolean;
  income_category_pattern: string;
};

export const DEFAULT_RENTAL_SETTINGS: RentalSettings = {
  currencies: [...config.moduleDefaults.rental.currencies],
  default_currency: config.moduleDefaults.rental.default_currency,
  contract_reminder_days_before: config.moduleDefaults.rental.contract_reminder_days_before,
  overdue_grace_days: config.moduleDefaults.rental.overdue_grace_days ?? 0,
  budget_sync_default: config.moduleDefaults.rental.budget_sync_default ?? false,
  income_category_pattern: config.moduleDefaults.rental.income_category_pattern ?? 'bérlet',
};

type HouseholdLike = {
  rental_settings?: RentalSettings;
  rentalSettings?: RentalSettings;
};

export function resolveRentalSettings(household?: HouseholdLike | null): RentalSettings {
  const raw = household?.rental_settings ?? household?.rentalSettings;
  if (!raw) {
    return {
      ...DEFAULT_RENTAL_SETTINGS,
      currencies: [...DEFAULT_RENTAL_SETTINGS.currencies],
    };
  }

  const currencies = Array.isArray(raw.currencies)
    ? raw.currencies.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : [...DEFAULT_RENTAL_SETTINGS.currencies];

  const defaultCurrency = String(raw.default_currency ?? DEFAULT_RENTAL_SETTINGS.default_currency)
    .trim()
    .toUpperCase();

  const reminder = Number(
    raw.contract_reminder_days_before ??
      (raw as { contractReminderDaysBefore?: number }).contractReminderDaysBefore ??
      DEFAULT_RENTAL_SETTINGS.contract_reminder_days_before,
  );

  const grace = Number(
    raw.overdue_grace_days ??
      (raw as { overdueGraceDays?: number }).overdueGraceDays ??
      DEFAULT_RENTAL_SETTINGS.overdue_grace_days,
  );

  const budgetSync = Boolean(
    raw.budget_sync_default ??
      (raw as { budgetSyncDefault?: boolean }).budgetSyncDefault ??
      DEFAULT_RENTAL_SETTINGS.budget_sync_default,
  );

  const pattern = String(
    raw.income_category_pattern ??
      (raw as { incomeCategoryPattern?: string }).incomeCategoryPattern ??
      DEFAULT_RENTAL_SETTINGS.income_category_pattern,
  ).trim();

  return {
    currencies: currencies.length > 0 ? currencies : [...DEFAULT_RENTAL_SETTINGS.currencies],
    default_currency: currencies.includes(defaultCurrency)
      ? defaultCurrency
      : (currencies[0] ?? DEFAULT_RENTAL_SETTINGS.default_currency),
    contract_reminder_days_before: Math.max(1, Math.min(365, Number.isFinite(reminder) ? reminder : 60)),
    overdue_grace_days: Math.max(0, Math.min(30, Number.isFinite(grace) ? grace : 0)),
    budget_sync_default: budgetSync,
    income_category_pattern: pattern !== '' ? pattern : 'bérlet',
  };
}

export function rentalSettingsForApi(settings: RentalSettings): RentalSettings {
  return { ...settings };
}
