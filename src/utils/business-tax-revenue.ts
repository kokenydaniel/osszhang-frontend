import type { RevenueBasis } from '@/config/business-tax';
import type { BusinessSettings } from '@/settings/business';
import type { BusinessOrder } from '@/types/business';

export type TaxRevenueLine = {
  orderId: number;
  date: string;
  customerName: string;
  amount: number;
  netAmount: number;
  invoiceId: string | null;
  hasInvoice: boolean;
  included: boolean;
  excludeReason?: string;
};

export type AnnualTaxRevenueResult = {
  /** AAM / adózási bevétel (bizonylatos tételek nettó összege) */
  total: number;
  orderCount: number;
  skippedCount: number;
  revenueBasis: RevenueBasis;
  lines: TaxRevenueLine[];
  /** Összes pozitív rendelés az évben (nettóítva, adózási beállítás szerint) */
  totalAllOrdersNet: number;
  allOrdersCount: number;
  /** Kimaradt: nincs bizonylat — totalAllOrdersNet − total */
  totalExcludedNet: number;
  /** AAM-on belül: „számla készült” jelöléssel */
  totalWithInvoiceFlagNet: number;
  withInvoiceFlagCount: number;
  /** AAM-on belül: csak számlasorszám, jelölés nélkül (része a total-nak, nem plusz) */
  invoiceIdOnlyCount: number;
  invoiceIdOnlyTotal: number;
};

/** Webshop rendelésszám — önmagában nem Számlázz bizonylat. */
function isLikelyShopOrderReference(invoiceId: string, order: BusinessOrder): boolean {
  const id = invoiceId.trim();
  if (!id) return true;
  if (order.shopifyOrderNumber && id === order.shopifyOrderNumber.trim()) return true;
  if (/^#\d+$/i.test(id)) return true;
  if (/^\d{4,}$/.test(id) && !/[A-Za-z]/.test(id)) return true;
  return false;
}

/**
 * Számlázz / AAM szempontból „számlás” tétel:
 * - explicit „számla vagy nyugta készült”, vagy
 * - valódi számlasorszám (nem puszta webshop rendelésszám).
 */
export function orderQualifiesAsDocumentedRevenue(order: BusinessOrder): boolean {
  if (order.amount <= 0) return false;
  if (order.hasInvoice) return true;

  const invoiceId = (order.invoiceId ?? '').trim();
  if (!invoiceId) return false;
  if (isLikelyShopOrderReference(invoiceId, order)) return false;

  return true;
}

export function orderCountsAsTaxRevenue(order: BusinessOrder, revenueBasis: RevenueBasis): boolean {
  if (order.amount <= 0) return false;
  if (revenueBasis === 'all_orders') return true;
  return orderQualifiesAsDocumentedRevenue(order);
}

/** AAM-nál nettó = összeg; áfás bruttó bevitelnél nettósítás. */
export function toNetRevenueAmount(amount: number, settings: Pick<BusinessSettings, 'default_vat_percent' | 'price_input_mode' | 'tax_regime'>): number {
  const vatPercent = settings.tax_regime === 'vat' ? settings.default_vat_percent : 0;
  if (vatPercent <= 0 || settings.price_input_mode === 'net') {
    return Math.round(amount * 100) / 100;
  }
  return Math.round((amount / (1 + vatPercent / 100)) * 100) / 100;
}

export type TaxRevenueSettings = Pick<
  BusinessSettings,
  | 'revenue_basis'
  | 'default_vat_percent'
  | 'price_input_mode'
  | 'tax_regime'
  | 'income_tax_method'
  | 'cost_ratio_percent'
>;

export function computeTaxRevenueFromOrders(
  orders: BusinessOrder[],
  settings: TaxRevenueSettings,
): AnnualTaxRevenueResult {
  const revenueBasis = settings.revenue_basis ?? 'documented_only';

  let total = 0;
  let orderCount = 0;
  let skippedCount = 0;
  let totalAllOrdersNet = 0;
  let allOrdersCount = 0;
  let totalWithInvoiceFlagNet = 0;
  let withInvoiceFlagCount = 0;
  let invoiceIdOnlyCount = 0;
  let invoiceIdOnlyTotal = 0;
  const lines: TaxRevenueLine[] = [];

  for (const order of orders) {
    const netAmount = toNetRevenueAmount(order.amount, settings);
    if (order.amount > 0) {
      totalAllOrdersNet += netAmount;
      allOrdersCount += 1;
    }

    const included = orderCountsAsTaxRevenue(order, revenueBasis);
    const invoiceId = (order.invoiceId ?? '').trim() || null;
    const hasInvoice = Boolean(order.hasInvoice);

    let excludeReason: string | undefined;
    if (!included) {
      skippedCount += 1;
      if (order.amount <= 0) {
        excludeReason = 'Nulla vagy negatív összeg';
      } else if (revenueBasis === 'documented_only') {
        excludeReason = !invoiceId && !hasInvoice
          ? 'Nincs bizonylat jelölés / számlasorszám'
          : 'Csak webshop rendelésszám — nem számla';
      }
    } else {
      total += netAmount;
      orderCount += 1;
      if (!hasInvoice && invoiceId) {
        invoiceIdOnlyCount += 1;
        invoiceIdOnlyTotal += netAmount;
      }
    }

    lines.push({
      orderId: order.id,
      date: order.date,
      customerName: order.customerName,
      amount: order.amount,
      netAmount,
      invoiceId,
      hasInvoice,
      included,
      excludeReason,
    });
  }

  lines.sort((a, b) => {
    if (a.included !== b.included) return a.included ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

  const totalExcludedNet = Math.round((totalAllOrdersNet - total) * 100) / 100;

  return {
    total,
    orderCount,
    skippedCount,
    revenueBasis,
    lines,
    totalAllOrdersNet,
    allOrdersCount,
    totalExcludedNet,
    totalWithInvoiceFlagNet,
    withInvoiceFlagCount,
    invoiceIdOnlyCount,
    invoiceIdOnlyTotal,
  };
}

export function computeAnnualTaxRevenue(
  orders: BusinessOrder[],
  year: number,
  settings: TaxRevenueSettings,
): AnnualTaxRevenueResult {
  return computeTaxRevenueFromOrders(
    orders.filter((o) => o.date.startsWith(String(year))),
    settings,
  );
}

export function computeMonthlyTaxRevenue(
  orders: BusinessOrder[],
  year: number,
  month: number,
  settings: TaxRevenueSettings,
): AnnualTaxRevenueResult {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return computeTaxRevenueFromOrders(
    orders.filter((o) => o.date.startsWith(prefix)),
    settings,
  );
}

export function estimatedAamTaxableIncome(
  netTotal: number,
  settings: Pick<BusinessSettings, 'tax_regime' | 'income_tax_method' | 'cost_ratio_percent'>,
): { taxable: number | null; costShare: number | null } {
  if (settings.tax_regime !== 'aam') {
    return { taxable: null, costShare: null };
  }
  if (settings.income_tax_method === 'cost_ratio') {
    const costShare = Math.round(netTotal * settings.cost_ratio_percent) / 100;
    return { taxable: Math.round((netTotal - costShare) * 100) / 100, costShare };
  }
  if (settings.income_tax_method === 'actual') {
    return { taxable: netTotal, costShare: null };
  }
  return { taxable: null, costShare: null };
}
