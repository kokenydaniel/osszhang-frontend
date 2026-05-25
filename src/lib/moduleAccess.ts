import type { UserProfile } from '@/types';
import { canAccessModuleByTier } from '@/lib/checkAccess';

export const MODULE_IDS = ['budget', 'savings', 'debts', 'utilities', 'meters', 'business'] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export const MODULE_LABELS: Record<ModuleId, string> = {
  budget: 'Költségvetés',
  savings: 'Megtakarítás',
  debts: 'Tartozások',
  utilities: 'Rezsi',
  meters: 'Közműórák',
  business: 'Vállalkozás',
};

type HouseholdLike = NonNullable<UserProfile['household']>;

function readFlag(household: HouseholdLike | undefined, snake: string, camel: string): boolean {
  if (!household) return false;
  const record = household as unknown as Record<string, unknown>;
  if (record[snake] !== undefined) return Boolean(record[snake]);
  if (record[camel] !== undefined) return Boolean(record[camel]);
  return false;
}

export function isModuleEnabled(household: HouseholdLike | undefined, moduleId: ModuleId): boolean {
  const flags: Record<ModuleId, [string, string]> = {
    budget: ['budget_enabled', 'budgetEnabled'],
    savings: ['savings_enabled', 'savingsEnabled'],
    debts: ['debts_enabled', 'debtsEnabled'],
    utilities: ['utilities_enabled', 'utilitiesEnabled'],
    meters: ['meters_enabled', 'metersEnabled'],
    business: ['business_enabled', 'businessEnabled'],
  };
  const [snake, camel] = flags[moduleId];
  return readFlag(household, snake, camel);
}

export function canAccessModule(user: UserProfile | null | undefined, moduleId: ModuleId): boolean {
  if (!user) return false;
  if (!isModuleEnabled(user.household, moduleId)) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.includes(moduleId) ?? false;
}

export function canUseModuleWithTier(user: UserProfile | null | undefined, moduleId: ModuleId): boolean {
  return canAccessModule(user, moduleId) && canAccessModuleByTier(user, moduleId);
}

export function enabledModuleIds(household: HouseholdLike | undefined): ModuleId[] {
  return MODULE_IDS.filter((id) => isModuleEnabled(household, id));
}
