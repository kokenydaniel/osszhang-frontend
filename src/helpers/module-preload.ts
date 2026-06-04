import type { UserProfile } from '@/types';
import { canUseModuleWithTier, type ModuleId } from '@/helpers/module-access';
import {
  preloadModule as preloadModuleFromPlan,
  type ModuleFetchOptions,
} from '@/helpers/module-data-plan';

export type { ModuleId };
export type ModulePreloadOptions = ModuleFetchOptions;

export { preloadModuleFromPlan as preloadModule };

export function enabledModules(user: UserProfile, moduleIds: ModuleId[]): ModuleId[] {
  return moduleIds.filter((id) => canUseModuleWithTier(user, id));
}
