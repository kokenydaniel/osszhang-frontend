import type { UserProfile } from '@/types';

export type HouseholdRole = 'admin' | 'editor' | 'reader';

export function normalizeHouseholdRole(role: string | undefined | null): HouseholdRole | string | undefined {
  if (!role) return undefined;
  if (role === 'viewer') return 'reader';
  if (role === 'member') return 'editor';
  return role;
}

export function isHouseholdReader(user: UserProfile | null | undefined): boolean {
  const role = normalizeHouseholdRole(user?.role);
  return role === 'reader';
}

export function canEditHousehold(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const role = normalizeHouseholdRole(user.role);
  return role === 'admin' || role === 'editor';
}

export function isHouseholdAdmin(user: UserProfile | null | undefined): boolean {
  return user?.role === 'admin';
}
