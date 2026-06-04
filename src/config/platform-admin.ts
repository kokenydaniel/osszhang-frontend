import type { UserProfile } from '@/types';

export function isPlatformAdmin(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const record = user as UserProfile & { lifetimeAdmin?: boolean };
  return Boolean(record.lifetime_admin ?? record.lifetimeAdmin);
}
