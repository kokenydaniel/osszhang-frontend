import type { SubscriptionTier } from './wallet';

export interface AdminHouseholdMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  lifetime_admin: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export interface AdminHouseholdModules {
  budget: boolean;
  savings: boolean;
  debts: boolean;
  utilities: boolean;
  meters: boolean;
  business: boolean;
  pocket_money: boolean;
  insurance: boolean;
  rental: boolean;
  receivables: boolean;
  travel_planner: boolean;
  utility_split: boolean;
}

export interface AdminHouseholdIntegration {
  enabled: boolean;
  configured: boolean;
  shop_url?: string | null;
  shop_id?: string | null;
  merchant_code?: string | null;
}

export interface AdminHouseholdIntegrations {
  shopify: AdminHouseholdIntegration;
  woocommerce: AdminHouseholdIntegration;
  unas: AdminHouseholdIntegration;
  sumup: AdminHouseholdIntegration;
}

export interface AdminHouseholdStats {
  wallets: number;
  transactions: number;
  debts: number;
  savings: number;
  utilities: number;
  meters: number;
  business_orders: number;
}

export interface AdminHouseholdAiUsageFeature {
  feature: string;
  total_tokens: number;
  request_count: number;
  cost_usd: number;
  requests_without_cost?: number;
}

export interface AdminHouseholdAiUsagePricing {
  source_url: string;
  last_verified: string | null;
  tier: string | null;
  default_model: string;
  default_model_rates: {
    input_per_million: number;
    output_per_million: number;
    cached_per_million: number | null;
    model: string;
  } | null;
}

export interface AdminHouseholdAiUsage {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  request_count: number;
  cost_usd: number;
  requests_without_cost: number;
  month_prompt_tokens: number;
  month_completion_tokens: number;
  month_total_tokens: number;
  month_request_count: number;
  month_cost_usd: number;
  month_requests_without_cost: number;
  by_feature: AdminHouseholdAiUsageFeature[];
  last_used_at: string | null;
  pricing_configured: boolean;
  pricing?: AdminHouseholdAiUsagePricing;
}

export interface AdminHouseholdAiSettings {
  usage_blocked: boolean;
  monthly_token_limit: number | null;
  monthly_limit_reached: boolean;
}

export interface AdminHouseholdAiSettingsPayload {
  usage_blocked?: boolean;
  monthly_token_limit?: number | null;
}

export interface AdminHousehold {
  id: number;
  name: string;
  business_name: string | null;
  billing_tier: SubscriptionTier;
  access_tier: SubscriptionTier;
  subscription_status: string;
  tier_grant: SubscriptionTier | null;
  tier_grant_expires_at: string | null;
  tier_grant_is_permanent: boolean;
  tier_grant_note: string | null;
  tier_grant_active: boolean;
  members_count: number;
  active_members_count: number | null;
  created_at: string | null;
  onboarding_completed?: boolean;
  categories?: string[];
  categories_count?: number;
  modules?: AdminHouseholdModules;
  integrations?: AdminHouseholdIntegrations;
  stats?: AdminHouseholdStats;
  ai_usage?: AdminHouseholdAiUsage;
  ai_settings?: AdminHouseholdAiSettings;
  members?: AdminHouseholdMember[];
}

export interface AdminHouseholdsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminHouseholdsApiResponse {
  data: AdminHousehold[];
  meta: AdminHouseholdsMeta;
}

export type AdminHouseholdTierFilter = 'all' | SubscriptionTier;

export interface AdminHouseholdsQuery {
  search?: string;
  tier?: AdminHouseholdTierFilter;
  page?: number;
  perPage?: number;
}

export interface AdminUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  lifetime_admin: boolean;
  is_active: boolean;
  household_id: number | null;
  household_name: string | null;
  business_name: string | null;
  household_subscription_tier: SubscriptionTier;
  billing_tier: SubscriptionTier;
  effective_tier: SubscriptionTier;
  tier_grant: SubscriptionTier | null;
  tier_grant_expires_at: string | null;
  tier_grant_is_permanent: boolean;
  tier_grant_note: string | null;
  tier_grant_active: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export interface AdminTierGrantPayload {
  grant_tier: 'pro' | 'premium' | null;
  permanent: boolean;
  expires_at: string | null;
  note: string | null;
}

export interface AdminUsersMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminUsersPage {
  users: AdminUser[];
  meta: AdminUsersMeta;
}

export interface AdminUsersApiResponse {
  data: AdminUser[];
  meta: AdminUsersMeta;
}

export type AdminUserStatusFilter = 'all' | 'active' | 'inactive';
export type AdminLifetimeAdminFilter = 'all' | 'yes' | 'no';

export interface AdminUsersQuery {
  search?: string;
  status?: AdminUserStatusFilter;
  lifetimeAdmin?: AdminLifetimeAdminFilter;
  page?: number;
  perPage?: number;
}

export interface ImpersonateResult {
  accessToken: string;
  user: import('@/types').UserProfile;
  target: AdminUser;
}

export interface FeatureFlag {
  key: string;
  value: boolean;
  description: string | null;
}

export type FeatureFlagsRecord = Record<string, FeatureFlag>;

export interface FeatureFlagsApiResponse {
  data: FeatureFlag[];
}

export type SystemAnnouncementType = 'info' | 'warning' | 'danger';

export interface SystemAnnouncement {
  id: number;
  message: string;
  type: SystemAnnouncementType;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface SystemAnnouncementsApiResponse {
  data: SystemAnnouncement[];
}

export interface CreateSystemAnnouncementPayload {
  message: string;
  type: SystemAnnouncementType;
}

export type ProductUpdateKind = 'new' | 'update' | 'tip' | 'general';

export type ProductUpdateAudienceRole = 'all' | 'admin' | 'editor' | 'reader';

export type ProductUpdateRequiredTier = 'all' | 'free' | 'pro' | 'premium';

export interface ProductUpdate {
  id: number;
  title: string;
  subtitle: string | null;
  body: string;
  bullets: string[];
  location_hint: string | null;
  kind: ProductUpdateKind;
  module_id: string | null;
  required_tier: ProductUpdateRequiredTier | null;
  audience_role: ProductUpdateAudienceRole | null;
  cta_label: string | null;
  cta_href: string | null;
  hero_icon: string | null;
  is_active: boolean;
  published_at: string | null;
  expires_at: string | null;
  priority: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductUpdatesApiResponse {
  data: ProductUpdate[];
}

export interface ProductUpdatePayload {
  title: string;
  subtitle?: string | null;
  body: string;
  bullets?: string[];
  location_hint?: string | null;
  kind?: ProductUpdateKind;
  module_id?: string | null;
  required_tier?: ProductUpdateRequiredTier | null;
  audience_role?: ProductUpdateAudienceRole | null;
  cta_label?: string | null;
  cta_href?: string | null;
  hero_icon?: string | null;
  is_active?: boolean;
  published_at?: string | null;
  expires_at?: string | null;
  priority?: number;
}
