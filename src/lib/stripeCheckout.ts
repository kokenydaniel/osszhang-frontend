import { subscriptionClient } from '@/lib/api-client';

export async function redirectToStripeCheckout(priceId: string): Promise<void> {
  const res = await subscriptionClient.checkout(priceId);
  window.location.href = res.data.url;
}

export async function redirectToStripePortal(): Promise<void> {
  const res = await subscriptionClient.getPortal();
  window.location.href = res.data.url;
}
