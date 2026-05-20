import { mapHouseholdFromApi } from '@/lib/mapHousehold';
import type { RawApiUser, UserProfile } from '@/types';

export function mapUserFromApi(u: RawApiUser): UserProfile {
  return {
    id: u.id,
    firstName: u.first_name || u.firstName || '',
    lastName: u.last_name || u.lastName || '',
    username: u.username || '',
    mustChangePassword: Boolean(u.must_change_password),
    role: u.role === 'admin' || u.role === 'editor' || u.role === 'reader' ? u.role : 'editor',
    permissions: u.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings'],
    household: u.household ? mapHouseholdFromApi(u.household) : undefined,
  };
}
