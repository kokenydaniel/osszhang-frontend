import type { BusinessOrder } from '@/types/business';

export type RawBusinessOrder = {
  id: number;
  date: string;
  customerName?: string;
  customer_name?: string;
  amount?: number;
  channel?: string;
  paymentMethod?: string;
  payment_method?: string;
  provider?: string;
  destination?: string;
  paidDate?: string | null;
  paid_date?: string | null;
  hasInvoice?: boolean;
  has_invoice?: boolean;
  invoiceId?: string | null;
  invoice_id?: string | null;
  shopifyOrderId?: string | null;
  shopify_order_id?: string | null;
  shopifyOrderNumber?: string | null;
  shopify_order_number?: string | null;
  state?: BusinessOrder['state'];
};

export type CreateBusinessOrderPayload = Omit<
  BusinessOrder,
  'id' | 'hasInvoice' | 'shopifyOrderId' | 'shopifyOrderNumber'
>;

export type UpdateBusinessOrderPayload = Partial<CreateBusinessOrderPayload>;

function normalizeState(state: BusinessOrder['state'] | undefined, paidDate: string | null): BusinessOrder['state'] {
  if (state === 'RENDBEN' || state === 'KINT' || state === 'KINT_PARKOL') return state;
  return paidDate ? 'RENDBEN' : 'KINT';
}

export function mapBusinessOrderFromApi(raw: RawBusinessOrder): BusinessOrder {
  const paidDate = raw.paidDate ?? raw.paid_date ?? null;

  return {
    id: raw.id,
    date: raw.date,
    customerName: raw.customerName ?? raw.customer_name ?? '',
    channel: raw.channel ?? '',
    paymentMethod: raw.paymentMethod ?? raw.payment_method ?? '',
    provider: raw.provider ?? '',
    destination: raw.destination ?? '',
    amount: Number(raw.amount ?? 0),
    paidDate,
    hasInvoice: raw.hasInvoice ?? raw.has_invoice ?? false,
    invoiceId: raw.invoiceId ?? raw.invoice_id ?? undefined,
    shopifyOrderId: raw.shopifyOrderId ?? raw.shopify_order_id ?? undefined,
    shopifyOrderNumber: raw.shopifyOrderNumber ?? raw.shopify_order_number ?? undefined,
    state: normalizeState(raw.state, paidDate),
  };
}

export function mapBusinessOrdersFromApi(rows: RawBusinessOrder[]): BusinessOrder[] {
  return rows.map(mapBusinessOrderFromApi);
}

export function businessOrderToApiPayload(
  data: CreateBusinessOrderPayload | UpdateBusinessOrderPayload,
): Record<string, unknown> {
  return {
    ...(data.date !== undefined ? { date: data.date } : {}),
    ...(data.customerName !== undefined ? { customerName: data.customerName } : {}),
    ...(data.amount !== undefined ? { amount: data.amount } : {}),
    ...(data.channel !== undefined ? { channel: data.channel } : {}),
    ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod } : {}),
    ...(data.provider !== undefined ? { provider: data.provider } : {}),
    ...(data.destination !== undefined ? { destination: data.destination } : {}),
    ...(data.paidDate !== undefined ? { paidDate: data.paidDate } : {}),
    ...(data.invoiceId !== undefined ? { invoiceId: data.invoiceId } : {}),
    ...(data.state !== undefined ? { state: data.state } : {}),
  };
}
