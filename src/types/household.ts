import type { UserProfile } from './auth';

export interface HouseholdProfile {
  id: number;
  name: string;
  invite_code: string;
  categories?: string[];
  budget_settings?: import('@/settings/budget').BudgetSettings;
  utilities_settings?: import('@/settings/utilities').UtilitiesSettings;
  dashboard_settings?: import('@/settings/dashboard').DashboardSettings;
  manual_balance?: number;
  budget_enabled?: boolean;
  savings_enabled?: boolean;
  debts_enabled?: boolean;
  utilities_enabled?: boolean;
  meters_enabled?: boolean;
  savings_settings?: import('@/settings/savings').SavingsSettings;
  debts_settings?: import('@/settings/debts').DebtsSettings;
  meters_settings?: import('@/settings/meters').MetersSettings;
  onboarding_completed?: boolean;
  subscription_tier?: import('./wallet').SubscriptionTier;
  subscription_status?: import('./wallet').SubscriptionStatus;
  billing_tier?: import('./wallet').SubscriptionTier;
  access_tier?: import('./wallet').SubscriptionTier;
  tier_grant?: import('./billing').BillingTierGrant | null;
  business_enabled?: boolean;
  business_name?: string;
  business_settings?: import('@/settings/business').BusinessSettings;
  shopify_shop_url?: string;
  shopify_import_enabled?: boolean;
  has_shopify_token?: boolean;
  utility_split_enabled?: boolean;
  utility_split_partner_id?: number | null;
  utility_templates?: import('@/config/utility-templates').UtilityTemplate[];
  users?: UserProfile[];
}

export type RawApiHousehold = HouseholdProfile;
