export interface BusinessOrder {
  id: number;
  date: string;
  customerName: string;
  channel: string;
  paymentMethod: string;
  provider: string;
  destination: string;
  amount: number;
  paidDate: string | null;
  hasInvoice?: boolean;
  invoiceId?: string;
  shopifyOrderId?: string;
  shopifyOrderNumber?: string;
  state: 'RENDBEN' | 'KINT' | 'KINT_PARKOL';
}
