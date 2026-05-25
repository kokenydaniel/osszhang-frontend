import type { RawApiUser, UserProfile } from './auth';

interface HouseholdFields {
  id: number;
  name: string;
  invite_code: string;
  categories?: string[];
  manual_balance?: number;
  manualBalance?: number;
  budget_enabled?: boolean;
  budgetEnabled?: boolean;
  savings_enabled?: boolean;
  savingsEnabled?: boolean;
  debts_enabled?: boolean;
  debtsEnabled?: boolean;
  utilities_enabled?: boolean;
  utilitiesEnabled?: boolean;
  meters_enabled?: boolean;
  metersEnabled?: boolean;
  savings_settings?: import('@/lib/savingsSettings').SavingsSettings;
  savingsSettings?: import('@/lib/savingsSettings').SavingsSettings;
  debts_settings?: import('@/lib/debtsSettings').DebtsSettings;
  debtsSettings?: import('@/lib/debtsSettings').DebtsSettings;
  meters_settings?: import('@/lib/metersSettings').MetersSettings;
  metersSettings?: import('@/lib/metersSettings').MetersSettings;
  onboarding_completed?: boolean;
  onboardingCompleted?: boolean;
  subscription_tier?: import('./wallet').SubscriptionTier;
  subscriptionTier?: import('./wallet').SubscriptionTier;
  subscription_status?: import('./wallet').SubscriptionStatus;
  subscriptionStatus?: import('./wallet').SubscriptionStatus;
  business_enabled?: boolean;
  businessEnabled?: boolean;
  business_name?: string;
  businessName?: string;
  business_settings?: import('@/lib/businessSettings').BusinessSettings;
  businessSettings?: import('@/lib/businessSettings').BusinessSettings;
  shopify_shop_url?: string;
  shopifyShopUrl?: string;
  shopify_import_enabled?: boolean;
  shopifyImportEnabled?: boolean;
  has_shopify_token?: boolean;
  hasShopifyToken?: boolean;
  utility_split_enabled?: boolean;
  utilitySplitEnabled?: boolean;
  utility_split_partner_id?: number | null;
  utilitySplitPartnerId?: number | null;
  utility_templates?: import('@/lib/utilityTemplates').UtilityTemplate[];
  utilityTemplates?: import('@/lib/utilityTemplates').UtilityTemplate[];
}

export interface RawApiHousehold extends HouseholdFields {
  users?: RawApiUser[];
}

export interface HouseholdProfile extends HouseholdFields {
  users?: UserProfile[];
}
