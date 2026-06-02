import { subscriptionClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { clearBillingCheckoutReturnFlags } from '@/helpers/billing-checkout-return';

export async function redirectToStripeCheckout(priceId: string): Promise<void> {
  clearBillingCheckoutReturnFlags();
  try {
    const res = await subscriptionClient.checkout(priceId);
    if (res && res[0] === StatusCodes.Http200) {
      window.location.href = res[1].url;
    }
  } catch (error) {
    console.error('Failed to redirect to Stripe checkout', error);
  }
}

export async function redirectToStripePortal(): Promise<void> {
  const res = await subscriptionClient.getPortal();
  if (res && res[0] === StatusCodes.Http200) {
    window.location.href = res[1].url;
  }
}
