import type { UtilitySplitRule } from '@/types';

export type UtilityTemplate = {
  type: string;
  total: number;
  due_day: number;
  split_rule: UtilitySplitRule;
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
      return {
        type,
        total: Math.max(0, Number(row.total) || 0),
        due_day: dueDay,
        split_rule: splitRule,
      };
    })
    .filter((t): t is UtilityTemplate => t !== null);
}

export function splitRuleLabel(rule: UtilitySplitRule, isAdmin: boolean): string {
  if (rule === 'shared') return 'Közös 50/50';
  if (rule === 'dani-private') return isAdmin ? 'Saját (te)' : 'Partner magán';
  return isAdmin ? 'Partner magán' : 'Saját (te)';
}
