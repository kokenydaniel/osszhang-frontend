import { subscriptionClient } from '@/lib/api-client';
import { clearBillingCheckoutReturnFlags } from '@/lib/billingCheckoutReturn';

export async function redirectToStripeCheckout(priceId: string): Promise<void> {
  clearBillingCheckoutReturnFlags();
  const res = await subscriptionClient.checkout(priceId);
  window.location.href = res.data.url;
}

export async function redirectToStripePortal(): Promise<void> {
  const res = await subscriptionClient.getPortal();
  window.location.href = res.data.url;
}
