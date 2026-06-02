import type { UserProfile } from '@/types';

export function isPlatformAdmin(user: UserProfile | null | undefined): boolean {
  return Boolean(user?.lifetime_admin);
}
