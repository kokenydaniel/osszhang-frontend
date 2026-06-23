import type {
  AiTravelComparison,
  AiTravelCostBreakdown,
  AiTravelFinancialFit,
  AiTravelPlan,
  AiTravelTransportDetail,
} from '@/types/ai';

export type TravelTransportMode = 'car' | 'plane' | 'train' | 'bus' | 'mixed';
export type TravelTripStyle = 'beach' | 'city' | 'adventure' | 'domestic' | 'mixed';
export type TravelAccommodationPreference = 'hostel' | 'hotel' | 'apartment' | 'mixed';

export type TravelFormInput = {
  destination: string;
  originLocation: string;
  durationDays: string;
  totalBudget: string;
  targetDate: string;
  travelersCount: string;
  tripStyle: TravelTripStyle;
  accommodationPreference: TravelAccommodationPreference;
  transportMode: TravelTransportMode;
  transportAlreadyBooked: boolean;
  accommodationAlreadyBooked: boolean;
  carFuelConsumption: string;
};

export type TravelCostLineItemStatus = 'planned' | 'paid' | 'excluded';

export type TravelCostLineItemCategory =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'activities'
  | 'insurance'
  | 'miscellaneous'
  | 'custom'
  | string;

export interface TravelCostLineItem {
  id: string;
  label: string;
  category: TravelCostLineItemCategory;
  amount_huf: number;
  status: TravelCostLineItemStatus;
  source: 'ai' | 'custom';
  split_enabled?: boolean;
  split_between?: number;
}

export type TravelPlanCostAdjustmentsPayload = {
  cost_line_items: TravelCostLineItem[];
  total_estimated_cost: number;
  remaining_to_pay_huf: number;
  paid_total_huf: number;
  cost_breakdown: AiTravelCostBreakdown;
  financial_fit?: AiTravelFinancialFit;
};

export type SavedTravelPlanRecord = {
  id: number;
  destination: string;
  origin_location?: string | null;
  duration_days: number;
  travelers_count: number;
  total_budget: number;
  target_date?: string | null;
  trip_style: string;
  accommodation_preference: string;
  transport_mode: string;
  transport_already_booked: boolean;
  accommodation_already_booked?: boolean;
  car_fuel_consumption_l100?: number | null;
  plan: AiTravelPlan;
  saving_id?: number | null;
  wallet_id?: number | null;
  created_at?: string;
  summary?: string | null;
  total_estimated_cost: number;
};

export type TravelPlanApiPayload = {
  destination: string;
  origin_location?: string;
  duration_days: number;
  total_budget: number;
  target_date?: string;
  travelers_count: number;
  trip_style: TravelTripStyle;
  accommodation_preference: TravelAccommodationPreference;
  transport_mode: TravelTransportMode;
  transport_already_booked: boolean;
  accommodation_already_booked?: boolean;
  car_fuel_consumption_l100?: number;
  wallet_id?: number;
  compare_budgets?: boolean;
  exchange_rates?: Record<string, number>;
};

export const TRAVEL_TRANSPORT_OPTIONS: Array<{ value: TravelTransportMode; label: string; hint: string }> = [
  { value: 'car', label: 'Autó', hint: 'Üzemanyag, útdíj, parkolás — fogyasztás alapján' },
  { value: 'plane', label: 'Repülő', hint: 'Oda-vissza jegy + illetékek realisztikus sávban' },
  { value: 'train', label: 'Vonat', hint: 'Nemzetközi/városi vonat tarifa becslés' },
  { value: 'bus', label: 'Busz', hint: 'Távolság alapú buszjegy becslés' },
  { value: 'mixed', label: 'Vegyes', hint: 'Autó vs. repülő — a reálisabb minimum' },
];

export const TRAVEL_STYLE_OPTIONS: Array<{ value: TravelTripStyle; label: string }> = [
  { value: 'mixed', label: 'Vegyes' },
  { value: 'beach', label: 'Tengerpart / nyaralás' },
  { value: 'city', label: 'Városlátogatás' },
  { value: 'adventure', label: 'Kaland / aktív' },
  { value: 'domestic', label: 'Belföld' },
];

export const TRAVEL_ACCOMMODATION_OPTIONS: Array<{ value: TravelAccommodationPreference; label: string }> = [
  { value: 'mixed', label: 'Vegyes' },
  { value: 'hostel', label: 'Hostel / budget' },
  { value: 'apartment', label: 'Apartman / Airbnb' },
  { value: 'hotel', label: 'Hotel' },
];

export function buildTravelPlanPayload(
  values: TravelFormInput,
  walletId?: number | null,
  exchangeRates?: Record<string, number>,
): TravelPlanApiPayload {
  const carFuel = Number.parseFloat(values.carFuelConsumption.replace(',', '.'));
  const rates =
    exchangeRates && Object.keys(exchangeRates).length > 0 ? exchangeRates : undefined;

  return {
    destination: values.destination.trim(),
    origin_location: values.originLocation.trim() || 'Budapest',
    duration_days: Number.parseInt(values.durationDays, 10),
    total_budget: Number.parseFloat(values.totalBudget.replace(/\s/g, '').replace(',', '.')),
    target_date: values.targetDate || undefined,
    travelers_count: Number.parseInt(values.travelersCount, 10) || 1,
    trip_style: values.tripStyle,
    accommodation_preference: values.accommodationPreference,
    transport_mode: values.transportMode,
    transport_already_booked: values.transportAlreadyBooked,
    accommodation_already_booked: values.accommodationAlreadyBooked,
    car_fuel_consumption_l100:
      values.transportMode === 'car' && Number.isFinite(carFuel) ? carFuel : undefined,
    wallet_id: walletId ?? undefined,
    compare_budgets: true,
    exchange_rates: rates,
  };
}

export function travelCostBreakdownEntries(
  breakdown: AiTravelCostBreakdown,
): Array<[keyof AiTravelCostBreakdown, number]> {
  return Object.entries(breakdown).filter(([, amount]) => typeof amount === 'number') as Array<
    [keyof AiTravelCostBreakdown, number]
  >;
}

export function travelCostChartData(breakdown: AiTravelCostBreakdown, total: number) {
  const labels: Record<string, string> = {
    transport: 'Közlekedés',
    accommodation: 'Szállás',
    food: 'Étel & ital',
    activities: 'Programok',
    insurance: 'Biztosítás',
    miscellaneous: 'Egyéb',
  };

  return travelCostBreakdownEntries(breakdown).map(([key, amount]) => ({
    key,
    label: labels[key] ?? key,
    amount,
    share: total > 0 ? (amount / total) * 100 : 0,
  }));
}

export function transportModeLabel(mode?: string): string {
  return TRAVEL_TRANSPORT_OPTIONS.find((o) => o.value === mode)?.label ?? mode ?? '—';
}

export function formatTransportDetail(detail?: AiTravelTransportDetail): string[] {
  if (!detail) return [];
  const lines = [detail.description];
  if (detail.fuel_liters && detail.fuel_price_per_liter_huf) {
    lines.push(
      `Üzemanyag: ${detail.fuel_liters.toFixed(1)} l × ${Math.round(detail.fuel_price_per_liter_huf).toLocaleString('hu-HU')} Ft/l`,
    );
  }
  if (detail.estimated_distance_km) {
    lines.push(`Becsült táv: ${detail.estimated_distance_km.toLocaleString('hu-HU')} km`);
  }
  return [...lines, ...(detail.notes ?? [])];
}

export function comparisonRows(comparison?: AiTravelComparison) {
  if (!comparison) return [];
  return [
    { key: 'minimum', label: 'Minimum (reális padló)', ...comparison.minimum },
    { key: 'requested', label: 'Megadott keret', ...comparison.requested },
    { key: 'planned', label: 'Aktuális terv', ...comparison.planned },
    { key: 'comfort', label: 'Komfort szint', ...comparison.comfort },
  ];
}
