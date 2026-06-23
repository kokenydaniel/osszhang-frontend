import type { UserProfile } from '@/types';

export function syncBudgetCategories(user: UserProfile | null): void {
  if (!user) return;

  const householdCats = user.household?.categories?.length
    ? user.household.categories
    : ['Fizetés', 'Élelmiszer', 'Rezsi'];

}
