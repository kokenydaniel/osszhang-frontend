import config, { type ModuleId } from '@/config/config';
import type { UserProfile } from '@/types';
import { canAccessModuleByTier } from '@/helpers/check-access';

export type { ModuleId };

export const moduleIds = config.modules.ids;
/** @deprecated Use `config.modules.ids` */
export const MODULE_IDS = config.modules.ids;
/** @deprecated Use `config.modules.labels` */
export const MODULE_LABELS = config.modules.labels;

type HouseholdLike = NonNullable<UserProfile['household']>;

function readFlag(household: HouseholdLike | undefined, snake: string, camel: string): boolean {
  if (!household) return false;
  const record = household as unknown as Record<string, unknown>;
  if (record[snake] !== undefined) return Boolean(record[snake]);
  if (record[camel] !== undefined) return Boolean(record[camel]);
  return false;
}

export function isModuleEnabled(household: HouseholdLike | undefined, moduleId: ModuleId): boolean {
  const [snake, camel] = config.modules.householdFlags[moduleId];
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
  return config.modules.ids.filter((id) => isModuleEnabled(household, id));
}
