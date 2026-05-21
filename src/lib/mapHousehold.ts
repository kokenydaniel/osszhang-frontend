import type { RawApiUser, UserProfile } from '@/types';
import { resolveBusinessSettings, type BusinessSettings } from '@/lib/businessSettings';
import { resolveUtilityTemplates, type UtilityTemplate } from '@/lib/utilityTemplates';

export function mapHouseholdFromApi(h: NonNullable<RawApiUser['household']>): NonNullable<UserProfile['household']> {
  return {
    id: h.id,
    name: h.name,
    invite_code: h.invite_code,
    categories: h.categories,
    manual_balance: h.manual_balance,
    manualBalance: h.manual_balance ?? h.manualBalance ?? 0,
    businessEnabled: h.business_enabled ?? h.businessEnabled ?? false,
    business_name: h.business_name,
    businessName: h.business_name ?? h.businessName ?? '',
    business_settings: resolveBusinessSettings(h as { business_settings?: BusinessSettings }),
    businessSettings: resolveBusinessSettings(h as { business_settings?: BusinessSettings }),
    shopify_shop_url: h.shopify_shop_url,
    shopifyShopUrl: h.shopify_shop_url ?? h.shopifyShopUrl ?? '',
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
