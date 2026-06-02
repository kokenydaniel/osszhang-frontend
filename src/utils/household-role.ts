import type { UserProfile } from '@/types';

export function isHouseholdReader(user: UserProfile | null | undefined): boolean {
  return user?.role === 'reader';
}

export function canEditHousehold(user: UserProfile | null | undefined): boolean {
  return !!user && user.role !== 'reader';
}

export function isHouseholdAdmin(user: UserProfile | null | undefined): boolean {
  return user?.role === 'admin';
}
