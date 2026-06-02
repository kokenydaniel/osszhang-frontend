import type { UserProfile } from '@/types';
// Removed useBudgetStore

export function syncBudgetCategories(user: UserProfile | null): void {
  if (!user) return;

  const householdCats = user.household?.categories?.length
    ? user.household.categories
    : ['Fizetés', 'Élelmiszer', 'Rezsi'];

  // Categories are no longer synced to a store
}
