import type { SubscriptionTier, SubscriptionStatus } from './wallet';

export interface BillingPaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export interface BillingUpcomingInvoice {
  date: string | null;
  amount: string;
}

export interface BillingInvoice {
  id: string;
  date: string;
  plan_label: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed' | 'open' | 'draft' | 'uncollectible' | 'void';
  status_label: string;
  pdf_url?: string | null;
  download_url?: string | null;
}

export interface BillingTierGrant {
  tier: SubscriptionTier;
  expires_at: string | null;
  is_permanent: boolean;
  note: string | null;
}

export interface BillingSummary {
  /** Fizetős / Stripe csomag — ezt számlázzuk. */
  billing_tier?: SubscriptionTier;
  /** Aktuális funkció-hozzáférés (grant + fizetős). */
  access_tier?: SubscriptionTier;
  effective_tier: SubscriptionTier;
  tier_grant?: BillingTierGrant | null;
  subscription_status: SubscriptionStatus;
  cancel_at_period_end: boolean;
  next_billing_date: string | null;
  access_ends_at: string | null;
  pending_downgrade_tier: SubscriptionTier | null;
  billing_amount: string;
  upcoming_invoice: BillingUpcomingInvoice | null;
  payment_method: BillingPaymentMethod | null;
  invoices: BillingInvoice[];
}

export type RawBillingSummary = BillingSummary;
export type RawBillingPaymentMethod = BillingPaymentMethod;
export type RawBillingInvoice = BillingInvoice;
export type RawBillingUpcomingInvoice = BillingUpcomingInvoice;
