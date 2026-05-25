import type { BillingInvoice, BillingPaymentMethod, BillingSummary, RawBillingSummary } from '@/types/billing';

function mapPaymentMethod(raw: NonNullable<RawBillingSummary['paymentMethod'] | RawBillingSummary['payment_method']>): BillingPaymentMethod {
  return {
    brand: raw.brand,
    last4: raw.last4,
    expMonth: raw.expMonth ?? raw.exp_month ?? 0,
    expYear: raw.expYear ?? raw.exp_year ?? 0,
  };
}

function mapInvoice(raw: NonNullable<RawBillingSummary['invoices']>[number]): BillingInvoice {
  return {
    id: raw.id,
    date: raw.date,
    planLabel: raw.planLabel ?? raw.plan_label ?? '',
    amount: raw.amount,
    status: raw.status,
    statusLabel: raw.statusLabel ?? raw.status_label ?? raw.status,
    pdfUrl: raw.pdfUrl ?? raw.pdf_url ?? null,
    downloadUrl: raw.downloadUrl ?? raw.download_url ?? null,
  };
}

function mapUpcomingInvoice(
  raw: RawBillingSummary['upcomingInvoice'] | RawBillingSummary['upcoming_invoice'],
): BillingSummary['upcomingInvoice'] {
  if (!raw?.amount) return null;
  return {
    date: raw.date ?? null,
    amount: raw.amount,
  };
}

export function mapBillingSummaryFromApi(raw: RawBillingSummary): BillingSummary {
  const paymentRaw = raw.paymentMethod ?? raw.payment_method ?? null;
  const effectiveTier = (raw.effectiveTier ?? raw.effective_tier ?? 'free') as BillingSummary['effectiveTier'];
  const subscriptionStatus = (raw.subscriptionStatus ??
    raw.subscription_status ??
    (effectiveTier === 'free' ? 'none' : 'active')) as BillingSummary['subscriptionStatus'];
  const cancelAtPeriodEnd = Boolean(
    raw.cancelAtPeriodEnd ?? raw.cancel_at_period_end ?? subscriptionStatus === 'canceled',
  );

  return {
    effectiveTier,
    subscriptionStatus,
    cancelAtPeriodEnd,
    nextBillingDate: raw.nextBillingDate ?? raw.next_billing_date ?? null,
    accessEndsAt: raw.accessEndsAt ?? raw.access_ends_at ?? null,
    pendingDowngradeTier: (raw.pendingDowngradeTier ?? raw.pending_downgrade_tier ?? null) as BillingSummary['pendingDowngradeTier'],
    billingAmount: raw.billingAmount ?? raw.billing_amount ?? '0 Ft',
    upcomingInvoice: mapUpcomingInvoice(raw.upcomingInvoice ?? raw.upcoming_invoice),
    paymentMethod: paymentRaw ? mapPaymentMethod(paymentRaw) : null,
    invoices: (raw.invoices ?? []).map(mapInvoice),
  };
}
