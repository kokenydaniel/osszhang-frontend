import type { RawApiUser, UserProfile } from '@/types';
import { resolveBusinessSettings, type BusinessSettings } from '@/lib/businessSettings';
import { resolveDebtsSettings, type DebtsSettings } from '@/lib/debtsSettings';
import { resolveMetersSettings, type MetersSettings } from '@/lib/metersSettings';
import { resolveSavingsSettings, type SavingsSettings } from '@/lib/savingsSettings';
import { resolveUtilityTemplates, type UtilityTemplate } from '@/lib/utilityTemplates';

export function mapHouseholdFromApi(h: NonNullable<RawApiUser['household']>): NonNullable<UserProfile['household']> {
  return {
    id: h.id,
    name: h.name,
    invite_code: h.invite_code,
    categories: h.categories,
    manual_balance: h.manual_balance,
    manualBalance: h.manual_balance ?? h.manualBalance ?? 0,
    budgetEnabled: h.budget_enabled ?? h.budgetEnabled ?? false,
    savingsEnabled: h.savings_enabled ?? h.savingsEnabled ?? false,
    debtsEnabled: h.debts_enabled ?? h.debtsEnabled ?? false,
    utilitiesEnabled: h.utilities_enabled ?? h.utilitiesEnabled ?? false,
    metersEnabled: h.meters_enabled ?? h.metersEnabled ?? false,
    savingsSettings: resolveSavingsSettings(h as { savings_settings?: SavingsSettings }),
    savings_settings: resolveSavingsSettings(h as { savings_settings?: SavingsSettings }),
    debtsSettings: resolveDebtsSettings(h as { debts_settings?: DebtsSettings }),
    debts_settings: resolveDebtsSettings(h as { debts_settings?: DebtsSettings }),
    metersSettings: resolveMetersSettings(h as { meters_settings?: MetersSettings }),
    meters_settings: resolveMetersSettings(h as { meters_settings?: MetersSettings }),
    onboardingCompleted: h.onboarding_completed ?? h.onboardingCompleted ?? false,
    onboarding_completed: h.onboarding_completed ?? h.onboardingCompleted ?? false,
    subscriptionTier: (h.subscriptionTier ?? h.subscription_tier ?? 'free') as import('@/types').SubscriptionTier,
    subscription_tier: (h.subscriptionTier ?? h.subscription_tier ?? 'free') as import('@/types').SubscriptionTier,
    subscriptionStatus: (h.subscriptionStatus ?? h.subscription_status ?? 'none') as import('@/types').SubscriptionStatus,
    subscription_status: (h.subscriptionStatus ?? h.subscription_status ?? 'none') as import('@/types').SubscriptionStatus,
    businessEnabled: h.business_enabled ?? h.businessEnabled ?? false,
    business_name: h.business_name,
    businessName: h.business_name ?? h.businessName ?? '',
    business_settings: resolveBusinessSettings(h as { business_settings?: BusinessSettings }),
    businessSettings: resolveBusinessSettings(h as { business_settings?: BusinessSettings }),
    shopify_shop_url: h.shopify_shop_url,
    shopifyShopUrl: h.shopify_shop_url ?? h.shopifyShopUrl ?? '',
    shopify_import_enabled: (h as { shopify_import_enabled?: boolean }).shopify_import_enabled ?? false,
    shopifyImportEnabled:
      (h as { shopify_import_enabled?: boolean }).shopify_import_enabled ??
      (h as { shopifyImportEnabled?: boolean }).shopifyImportEnabled ??
      false,
    has_shopify_token: (h as { has_shopify_token?: boolean }).has_shopify_token ?? false,
    hasShopifyToken: (h as { has_shopify_token?: boolean }).has_shopify_token ?? false,
    utility_split_enabled: h.utility_split_enabled,
    utilitySplitEnabled: h.utility_split_enabled ?? h.utilitySplitEnabled ?? false,
    utility_split_partner_id: h.utility_split_partner_id,
    utilitySplitPartnerId: h.utility_split_partner_id ?? h.utilitySplitPartnerId ?? null,
    utility_templates: resolveUtilityTemplates(h as { utility_templates?: UtilityTemplate[] }),
    utilityTemplates: resolveUtilityTemplates(h as { utility_templates?: UtilityTemplate[] }),
    users: h.users
      ? h.users.map(
          (hu): UserProfile => ({
            id: hu.id,
            firstName: hu.first_name || hu.firstName || '',
            lastName: hu.last_name || hu.lastName || '',
            username: hu.username || '',
            mustChangePassword: Boolean(hu.must_change_password),
            role: hu.role === 'admin' || hu.role === 'editor' || hu.role === 'reader' ? hu.role : 'editor',
            permissions: hu.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings'],
          }),
        )
      : [],
  };
}
