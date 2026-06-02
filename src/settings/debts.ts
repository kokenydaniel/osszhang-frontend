import config from '@/config/config';

export type DebtStrategy = 'avalanche' | 'snowball';

export type DebtTypeTemplate = {
  label: string;
  default_interest_rate_annual: number;
};

export type DebtsSettings = {
  default_strategy: DebtStrategy;
  default_extra_monthly: number;
  pay_add_to_budget_default: boolean;
  payment_category_pattern: string;
  reminder_days_before: number;
  default_interest_rate_annual: number;
  debt_type_templates: DebtTypeTemplate[];
};

export const DEFAULT_DEBTS_SETTINGS: DebtsSettings = {
  ...config.moduleDefaults.debts,
  debt_type_templates: [...config.moduleDefaults.debts.debt_type_templates],
};

type HouseholdLike = {
  debts_settings?: DebtsSettings;
  debtsSettings?: DebtsSettings;
};

function normalizeTemplates(raw: DebtTypeTemplate[] | undefined): DebtTypeTemplate[] {
  return (raw ?? [])
    .map((row) => ({
      label: row.label?.trim() ?? '',
      default_interest_rate_annual: Math.max(0, Math.min(100, Number(row.default_interest_rate_annual) || 0)),
    }))
    .filter((row) => row.label.length > 0);
}

export function resolveDebtsSettings(household?: HouseholdLike | null): DebtsSettings {
  const raw = household?.debts_settings ?? household?.debtsSettings;
  if (!raw) return { ...DEFAULT_DEBTS_SETTINGS, debt_type_templates: [...DEFAULT_DEBTS_SETTINGS.debt_type_templates] };

  const strategy: DebtStrategy =
    raw.default_strategy === 'snowball' ? 'snowball' : 'avalanche';

  const templates =
    raw.debt_type_templates !== undefined
      ? normalizeTemplates(raw.debt_type_templates)
      : [...DEFAULT_DEBTS_SETTINGS.debt_type_templates];

  return {
    default_strategy: strategy,
    default_extra_monthly: Math.max(0, Number(raw.default_extra_monthly) || 0),
    pay_add_to_budget_default: raw.pay_add_to_budget_default ?? DEFAULT_DEBTS_SETTINGS.pay_add_to_budget_default,
    payment_category_pattern:
      raw.payment_category_pattern?.trim() || DEFAULT_DEBTS_SETTINGS.payment_category_pattern,
    reminder_days_before: Math.max(0, Math.min(60, Number(raw.reminder_days_before) || 0)),
    default_interest_rate_annual: Math.max(
      0,
      Math.min(100, Number(raw.default_interest_rate_annual) || 0),
    ),
    debt_type_templates: templates,
  };
}

export function debtsSettingsForApi(settings: DebtsSettings): DebtsSettings {
  return {
    ...settings,
    debt_type_templates: settings.debt_type_templates.filter((t) => t.label.trim().length > 0),
  };
}

export function matchPaymentCategory(categories: string[], pattern: string): string {
  if (categories.length === 0) return '';
  try {
    const regex = new RegExp(pattern, 'i');
    return categories.find((c) => regex.test(c)) ?? categories[0];
  } catch {
    return categories[0];
  }
}
