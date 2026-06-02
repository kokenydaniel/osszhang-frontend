import type { UtilitySplitRule } from '@/types';
export { utilitiesCalculations as default } from '@/calculations/utilities';

export type UtilityTemplate = {
  type: string;
  total: number;
  due_day: number;
  split_rule: UtilitySplitRule;
  provider?: string;
  payment_method?: string;
  budget_category?: string;
};

type HouseholdLike = {
  utility_templates?: UtilityTemplate[];
  utilityTemplates?: UtilityTemplate[];
};

export function resolveUtilityTemplates(household?: HouseholdLike | null): UtilityTemplate[] {
  const raw = household?.utility_templates ?? household?.utilityTemplates;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((row) => {
      const type = String(row.type ?? '').trim();
      if (!type) return null;
      const dueDay = Math.min(28, Math.max(1, Number(row.due_day ?? 15) || 15));
      const split = row.split_rule;
      const splitRule: UtilitySplitRule =
        split === 'shared' || split === 'dani-private' || split === 'ildi-private' ? split : 'shared';
      const rawRow = row as UtilityTemplate & { paymentMethod?: string; budgetCategory?: string };
      const provider = String(rawRow.provider ?? '').trim();
      const paymentMethod = String(rawRow.payment_method ?? rawRow.paymentMethod ?? '').trim();
      const budgetCategory = String(rawRow.budget_category ?? rawRow.budgetCategory ?? '').trim();

      return {
        type,
        total: Math.max(0, Number(row.total) || 0),
        due_day: dueDay,
        split_rule: splitRule,
        ...(provider ? { provider } : {}),
        ...(paymentMethod ? { payment_method: paymentMethod } : {}),
        ...(budgetCategory ? { budget_category: budgetCategory } : {}),
      };
    })
    .filter((t): t is UtilityTemplate => t !== null);
}
