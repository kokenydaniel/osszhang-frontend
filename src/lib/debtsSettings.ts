export type DebtStrategy = 'avalanche' | 'snowball';

export type DebtsSettings = {
  default_strategy: DebtStrategy;
  default_extra_monthly: number;
  pay_add_to_budget_default: boolean;
  payment_category_pattern: string;
};

export const DEFAULT_DEBTS_SETTINGS: DebtsSettings = {
  default_strategy: 'avalanche',
  default_extra_monthly: 0,
  pay_add_to_budget_default: true,
  payment_category_pattern: 'hitel|tartoz|törleszt',
};

type HouseholdLike = {
  debts_settings?: DebtsSettings;
  debtsSettings?: DebtsSettings;
};

export function resolveDebtsSettings(household?: HouseholdLike | null): DebtsSettings {
  const raw = household?.debts_settings ?? household?.debtsSettings;
  if (!raw) return { ...DEFAULT_DEBTS_SETTINGS };

  const strategy: DebtStrategy =
    raw.default_strategy === 'snowball' ? 'snowball' : 'avalanche';

  return {
    default_strategy: strategy,
    default_extra_monthly: Math.max(0, Number(raw.default_extra_monthly) || 0),
    pay_add_to_budget_default: raw.pay_add_to_budget_default ?? DEFAULT_DEBTS_SETTINGS.pay_add_to_budget_default,
    payment_category_pattern:
      raw.payment_category_pattern?.trim() || DEFAULT_DEBTS_SETTINGS.payment_category_pattern,
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
