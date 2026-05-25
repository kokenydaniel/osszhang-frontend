import type { SubscriptionTier, SubscriptionStatus } from './wallet';

export interface BillingPaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface BillingUpcomingInvoice {
  date: string | null;
  amount: string;
}

export interface BillingInvoice {
  id: string;
  date: string;
  planLabel: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed' | 'open' | 'draft' | 'uncollectible' | 'void';
  statusLabel: string;
  pdfUrl?: string | null;
  downloadUrl?: string | null;
}

export interface BillingSummary {
  effectiveTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  nextBillingDate: string | null;
  accessEndsAt: string | null;
  pendingDowngradeTier: SubscriptionTier | null;
  billingAmount: string;
  upcomingInvoice: BillingUpcomingInvoice | null;
  paymentMethod: BillingPaymentMethod | null;
  invoices: BillingInvoice[];
}

export interface RawBillingSummary {
  effectiveTier?: SubscriptionTier;
  effective_tier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  subscription_status?: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
  cancel_at_period_end?: boolean;
  nextBillingDate?: string | null;
  next_billing_date?: string | null;
  accessEndsAt?: string | null;
  access_ends_at?: string | null;
  pendingDowngradeTier?: SubscriptionTier | null;
  pending_downgrade_tier?: SubscriptionTier | null;
  billingAmount?: string;
  billing_amount?: string;
  upcomingInvoice?: RawBillingUpcomingInvoice | null;
  upcoming_invoice?: RawBillingUpcomingInvoice | null;
  paymentMethod?: RawBillingPaymentMethod | null;
  payment_method?: RawBillingPaymentMethod | null;
  invoices?: RawBillingInvoice[];
}

export interface RawBillingPaymentMethod {
  brand: string;
  last4: string;
  expMonth?: number;
  exp_month?: number;
  expYear?: number;
  exp_year?: number;
}

export interface RawBillingInvoice {
  id: string;
  date: string;
  planLabel?: string;
  plan_label?: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed' | 'open';
  statusLabel?: string;
  status_label?: string;
  pdfUrl?: string | null;
  pdf_url?: string | null;
  downloadUrl?: string | null;
  download_url?: string | null;
}

export interface RawBillingUpcomingInvoice {
  date?: string | null;
  amount: string;
}
