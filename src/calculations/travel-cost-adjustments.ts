import type { AiTravelCostBreakdown, AiTravelFinancialFit, AiTravelPlan } from '@/types/ai';
import type { TravelCostLineItem, TravelCostLineItemStatus } from '@/types/travel';
import { travelCostBreakdownEntries } from '@/types/travel';
import { formatHUF } from '@/utils';
import { dayjs } from '@/utils/dates';

export const TRAVEL_COST_CATEGORY_LABELS: Record<string, string> = {
  transport: 'Közlekedés',
  accommodation: 'Szállás',
  food: 'Étel & ital',
  activities: 'Programok',
  insurance: 'Utazásbiztosítás',
  miscellaneous: 'Egyéb / puffer',
  custom: 'Egyéb',
};

export type TravelCostSummary = {
  totalTripHuf: number;
  totalFullHuf: number;
  remainingToPayHuf: number;
  paidTotalHuf: number;
  excludedTotalHuf: number;
  hasSplitItems: boolean;
};

export function lineItemOurShareHuf(item: TravelCostLineItem): number {
  const amount = item.amount_huf;
  if (!item.split_enabled) {
    return amount;
  }

  const parts = Math.max(2, Math.floor(Number(item.split_between) || 2));

  return round2(amount / parts);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function fmt(amount: number): string {
  return formatHUF(amount);
}

export function createTravelCostLineItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLineItem(item: TravelCostLineItem): TravelCostLineItem {
  const splitEnabled = Boolean(item.split_enabled);
  const splitBetween = splitEnabled ? Math.max(2, Math.floor(Number(item.split_between) || 2)) : undefined;

  return {
    ...item,
    split_enabled: splitEnabled,
    split_between: splitBetween,
  };
}

export function initializeCostLineItems(plan: AiTravelPlan): TravelCostLineItem[] {
  if (plan.cost_line_items?.length) {
    return plan.cost_line_items.map((item) => normalizeLineItem({ ...item }));
  }

  return travelCostBreakdownEntries(plan.cost_breakdown)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) =>
      normalizeLineItem({
        id: `ai-${key}`,
        label: TRAVEL_COST_CATEGORY_LABELS[key] ?? key,
        category: key,
        amount_huf: amount,
        status: 'planned' as const,
        source: 'ai' as const,
        split_enabled: false,
      }),
    );
}

export function summarizeCostLineItems(items: TravelCostLineItem[]): TravelCostSummary {
  const active = items.filter((item) => item.status !== 'excluded');
  const hasSplitItems = active.some((item) => item.split_enabled);

  return {
    totalTripHuf: round2(active.reduce((sum, item) => sum + lineItemOurShareHuf(item), 0)),
    totalFullHuf: round2(active.reduce((sum, item) => sum + item.amount_huf, 0)),
    remainingToPayHuf: round2(
      active
        .filter((item) => item.status === 'planned')
        .reduce((sum, item) => sum + lineItemOurShareHuf(item), 0),
    ),
    paidTotalHuf: round2(
      active
        .filter((item) => item.status === 'paid')
        .reduce((sum, item) => sum + lineItemOurShareHuf(item), 0),
    ),
    excludedTotalHuf: round2(
      items.filter((item) => item.status === 'excluded').reduce((sum, item) => sum + item.amount_huf, 0),
    ),
    hasSplitItems,
  };
}

export function lineItemsToBreakdown(items: TravelCostLineItem[]): AiTravelCostBreakdown {
  const breakdown: AiTravelCostBreakdown = {
    transport: 0,
    accommodation: 0,
    food: 0,
    activities: 0,
    insurance: 0,
    miscellaneous: 0,
  };

  for (const item of items) {
    if (item.status === 'excluded' || item.amount_huf <= 0) continue;

    const key =
      item.category !== 'custom' && item.category in breakdown
        ? (item.category as keyof AiTravelCostBreakdown)
        : 'miscellaneous';

    breakdown[key] = round2((breakdown[key] ?? 0) + lineItemOurShareHuf(item));
  }

  return breakdown;
}

function resolveMonthsUntilTrip(
  targetDate: string | null | undefined,
  financialContext?: Record<string, unknown>,
): number | null {
  if (targetDate) {
    const target = dayjs(targetDate).startOf('day');
    if (target.isValid()) {
      return Math.max(1, target.diff(dayjs().startOf('day'), 'month'));
    }
  }

  const fromContext = financialContext?.months_until_trip;
  if (fromContext != null && Number.isFinite(Number(fromContext))) {
    return Math.max(1, Number(fromContext));
  }

  return null;
}

export function recalculateTravelFinancialFit(
  baseFit: AiTravelFinancialFit | undefined,
  financialContext: Record<string, unknown> | undefined,
  remainingToPayHuf: number,
  targetDate?: string | null,
): AiTravelFinancialFit | undefined {
  if (!baseFit) return undefined;

  const ctx = financialContext ?? {};
  const disposable = round2(
    Number(ctx.disposable_remaining ?? ctx.disposable_remaining_huf ?? baseFit.disposable_remaining_huf ?? 0),
  );
  const travelSavings = round2(
    Number(ctx.travel_eligible_savings_huf ?? baseFit.travel_eligible_savings_huf ?? 0),
  );
  const available = round2(Number(ctx.available_for_trip_huf ?? disposable + travelSavings));
  const capacity = round2(
    Number(ctx.monthly_savings_capacity_huf ?? baseFit.monthly_savings_capacity_huf ?? 0),
  );
  const tripCost = round2(remainingToPayHuf);
  const canPayNow = available >= tripCost;
  const shortfall = round2(Math.max(0, tripCost - available));
  const monthsUntilTrip = resolveMonthsUntilTrip(targetDate, ctx);

  const displayFields: AiTravelFinancialFit = {
    ...baseFit,
    trip_cost_huf: tripCost,
    disposable_remaining_huf: disposable,
    travel_eligible_savings_huf: travelSavings,
    available_for_trip_huf: available,
    monthly_savings_capacity_huf: capacity,
  };

  const savingsSuffix =
    travelSavings > 0 ? ` + megtakarítás ${fmt(travelSavings)}` : '';

  if (monthsUntilTrip === null) {
    const summary = canPayNow
      ? `A hátralévő utazási költség ${fmt(tripCost)}. Rendelkezésre áll: Marad ${fmt(disposable)}${travelSavings > 0 ? ` + utazásra számítható megtakarítás ${fmt(travelSavings)} = ${fmt(available)}` : ''} — ez fedezi az utat.`
      : `A hátralévő költség ${fmt(tripCost)}, rendelkezésre áll ${fmt(available)} (Marad ${fmt(disposable)}${savingsSuffix}). Hiány: ${fmt(shortfall)}. Add meg az indulás dátumát a havi félretételi tervhez.`;

    return {
      ...displayFields,
      monthly_amount_huf: null,
      months: null,
      target_date: null,
      fits_current_budget: canPayNow,
      can_pay_now: canPayNow,
      has_savings_schedule: false,
      summary,
      required_monthly_savings_huf: null,
    };
  }

  const months = monthsUntilTrip;
  const requiredMonthly = round2(shortfall / months);
  const fitsMonthly = shortfall <= 0 || (capacity > 0 && capacity >= requiredMonthly);
  const fits = canPayNow || fitsMonthly;

  let summary: string;
  if (canPayNow) {
    summary = `A hátralévő ${fmt(tripCost)} fedezhető a rendelkezésre álló ${fmt(available)} összegből (Marad ${fmt(disposable)}${savingsSuffix}).`;
  } else if (fitsMonthly) {
    summary = `Most ${fmt(available)} áll rendelkezésre (Marad ${fmt(disposable)}${savingsSuffix}). A hiány (${fmt(shortfall)}) fedezhető havi ${fmt(requiredMonthly)} félretétellel ${months} hónap alatt.`;
  } else {
    summary = `A hátralévő költség ${fmt(tripCost)}, rendelkezésre áll ${fmt(available)} (Marad ${fmt(disposable)}${savingsSuffix}). Hiány ${fmt(shortfall)} — havi ${fmt(requiredMonthly)} kellene ${months} hónap alatt, de a becsült havi kapacitás csak ${fmt(capacity)}.`;
  }

  return {
    ...displayFields,
    monthly_amount_huf: requiredMonthly,
    months,
    target_date: targetDate ?? baseFit.target_date ?? null,
    fits_current_budget: fits,
    can_pay_now: canPayNow,
    fits_monthly_savings: fitsMonthly,
    has_savings_schedule: true,
    summary,
    required_monthly_savings_huf: requiredMonthly,
  };
}

export function applyCostLineItemsToPlan(
  plan: AiTravelPlan,
  lineItems: TravelCostLineItem[],
  targetDate?: string | null,
): AiTravelPlan {
  const summary = summarizeCostLineItems(lineItems);
  const costBreakdown = lineItemsToBreakdown(lineItems);

  return {
    ...plan,
    cost_line_items: lineItems,
    cost_breakdown: costBreakdown,
    total_estimated_cost: summary.totalTripHuf,
    remaining_to_pay_huf: summary.remainingToPayHuf,
    paid_total_huf: summary.paidTotalHuf,
    financial_fit: recalculateTravelFinancialFit(
      plan.financial_fit,
      plan.financial_context,
      summary.remainingToPayHuf,
      targetDate,
    ),
  };
}

export function setLineItemStatus(
  items: TravelCostLineItem[],
  id: string,
  status: TravelCostLineItemStatus,
): TravelCostLineItem[] {
  return items.map((item) => (item.id === id ? { ...item, status } : item));
}

export function updateLineItemAmount(
  items: TravelCostLineItem[],
  id: string,
  amountHuf: number,
): TravelCostLineItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, amount_huf: round2(Math.max(0, amountHuf)) } : item,
  );
}

export function updateLineItemLabel(
  items: TravelCostLineItem[],
  id: string,
  label: string,
): TravelCostLineItem[] {
  return items.map((item) => (item.id === id ? { ...item, label: label.trim() || item.label } : item));
}

export function removeLineItem(items: TravelCostLineItem[], id: string): TravelCostLineItem[] {
  return items.filter((item) => item.id !== id);
}

export function addCustomLineItem(items: TravelCostLineItem[]): TravelCostLineItem[] {
  return [
    ...items,
    {
      id: createTravelCostLineItemId(),
      label: 'Új tétel',
      category: 'custom',
      amount_huf: 0,
      status: 'planned',
      source: 'custom',
      split_enabled: false,
    },
  ];
}

export function updateLineItemSplit(
  items: TravelCostLineItem[],
  id: string,
  splitEnabled: boolean,
  splitBetween?: number,
): TravelCostLineItem[] {
  return items.map((item) => {
    if (item.id !== id) return item;

    if (!splitEnabled) {
      return normalizeLineItem({ ...item, split_enabled: false, split_between: undefined });
    }

    return normalizeLineItem({
      ...item,
      split_enabled: true,
      split_between: splitBetween ?? item.split_between ?? 2,
    });
  });
}
