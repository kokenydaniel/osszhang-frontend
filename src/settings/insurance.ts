import config from '@/config/config';

export type InsuranceSettings = {
  reminder_days_before: number;
  currencies: string[];
  default_currency: string;
  payment_category_pattern: string;
  budget_sync_default: boolean;
};

export const DEFAULT_INSURANCE_SETTINGS: InsuranceSettings = {
  reminder_days_before: config.moduleDefaults.insurance.reminder_days_before,
  currencies: [...config.moduleDefaults.insurance.currencies],
  default_currency: config.moduleDefaults.insurance.default_currency,
  payment_category_pattern: config.moduleDefaults.insurance.payment_category_pattern,
  budget_sync_default: config.moduleDefaults.insurance.budget_sync_default,
};

type HouseholdLike = {
  insurance_settings?: InsuranceSettings;
  insuranceSettings?: InsuranceSettings;
};

export function resolveInsuranceSettings(household?: HouseholdLike | null): InsuranceSettings {
  const raw = household?.insurance_settings ?? household?.insuranceSettings;
  if (!raw) {
    return {
      ...DEFAULT_INSURANCE_SETTINGS,
      currencies: [...DEFAULT_INSURANCE_SETTINGS.currencies],
    };
  }

  const reminder = Number(
    raw.reminder_days_before ??
      (raw as { reminderDaysBefore?: number }).reminderDaysBefore ??
      DEFAULT_INSURANCE_SETTINGS.reminder_days_before,
  );

  const currencies = Array.isArray(raw.currencies)
    ? raw.currencies.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : [...DEFAULT_INSURANCE_SETTINGS.currencies];

  const defaultCurrency = String(raw.default_currency ?? DEFAULT_INSURANCE_SETTINGS.default_currency)
    .trim()
    .toUpperCase();

  const categoryPattern = String(
    raw.payment_category_pattern ??
      (raw as { paymentCategoryPattern?: string }).paymentCategoryPattern ??
      DEFAULT_INSURANCE_SETTINGS.payment_category_pattern,
  ).trim();

  const budgetSyncDefault = Boolean(
    raw.budget_sync_default ??
      (raw as { budgetSyncDefault?: boolean }).budgetSyncDefault ??
      DEFAULT_INSURANCE_SETTINGS.budget_sync_default,
  );

  return {
    reminder_days_before: Number.isFinite(reminder)
      ? Math.min(365, Math.max(1, Math.round(reminder)))
      : 30,
    currencies: currencies.length > 0 ? currencies : [...DEFAULT_INSURANCE_SETTINGS.currencies],
    default_currency: currencies.includes(defaultCurrency) ? defaultCurrency : currencies[0],
    payment_category_pattern: categoryPattern || 'biztosít',
    budget_sync_default: budgetSyncDefault,
  };
}

export function matchPaymentCategory(categories: string[], pattern: string): string {
  if (categories.length === 0) return 'Biztosítás';
  try {
    const regex = new RegExp(pattern, 'i');
    return categories.find((c) => regex.test(c)) ?? 'Biztosítás';
  } catch {
    return 'Biztosítás';
  }
}

export function insuranceSettingsForApi(settings: InsuranceSettings): InsuranceSettings {
  return {
    reminder_days_before: settings.reminder_days_before,
    currencies: settings.currencies.map((c) => c.trim().toUpperCase()).filter(Boolean),
    default_currency: settings.default_currency.trim().toUpperCase(),
    payment_category_pattern: settings.payment_category_pattern.trim() || 'biztosít',
    budget_sync_default: settings.budget_sync_default,
  };
}
