import config from '@/config/config';
import {
  DEFAULT_TAX_SETTINGS,
  type IncomeTaxMethod,
  type RevenueBasis,
  type TaxRegime,
} from '@/config/business-tax';
import { pickList } from '@/utils/pick-list';

export type ShopifySyncSchedule = 'off' | 'hourly' | 'every_6_hours' | 'daily';

export type OrderStatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'primary';

export type BusinessSettings = {
  channels: string[];
  payment_methods: string[];
  providers: string[];
  destinations: string[];
  default_vat_percent: number;
  price_input_mode: 'net' | 'gross';
  order_statuses: string[];
  order_status_colors: Record<string, OrderStatusTone>;
  shopify_sync_schedule: ShopifySyncSchedule;
  shopify_last_synced_at: string | null;
  sumup_last_synced_at: string | null;
  tax_regime: TaxRegime;
  income_tax_method: IncomeTaxMethod;
  cost_ratio_percent: number;
  revenue_basis: RevenueBasis;
};

export const ORDER_STATUS_TONES: OrderStatusTone[] = [
  'success',
  'warning',
  'danger',
  'info',
  'primary',
  'neutral',
];

export const ORDER_STATUS_TONE_LABELS: Record<OrderStatusTone, string> = {
  success: 'Zöld',
  warning: 'Sárga',
  danger: 'Piros',
  info: 'Kék',
  primary: 'Lila',
  neutral: 'Szürke',
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  ...config.moduleDefaults.business,
  order_statuses: [...config.moduleDefaults.business.order_statuses],
  order_status_colors: { ...config.moduleDefaults.business.order_status_colors },
};

type HouseholdLike = {
  business_settings?: BusinessSettings;
  businessSettings?: BusinessSettings;
};

export function resolveBusinessSettings(household?: HouseholdLike | null): BusinessSettings {
  const raw = household?.business_settings ?? household?.businessSettings;
  if (!raw) {
    return {
      ...DEFAULT_BUSINESS_SETTINGS,
      order_statuses: [...DEFAULT_BUSINESS_SETTINGS.order_statuses],
      order_status_colors: { ...DEFAULT_BUSINESS_SETTINGS.order_status_colors },
    };
  }

  const priceMode = raw.price_input_mode === 'net' ? 'net' : 'gross';
  const schedule: ShopifySyncSchedule =
    raw.shopify_sync_schedule === 'hourly' ||
    raw.shopify_sync_schedule === 'every_6_hours' ||
    raw.shopify_sync_schedule === 'daily'
      ? raw.shopify_sync_schedule
      : 'off';

  const statuses = pickList(raw.order_statuses, DEFAULT_BUSINESS_SETTINGS.order_statuses);
  const resolvedStatuses = statuses.length > 0 ? statuses : [...DEFAULT_BUSINESS_SETTINGS.order_statuses];

  return {
    channels: pickList(raw.channels, DEFAULT_BUSINESS_SETTINGS.channels),
    payment_methods: pickList(raw.payment_methods, DEFAULT_BUSINESS_SETTINGS.payment_methods),
    providers: pickList(raw.providers, DEFAULT_BUSINESS_SETTINGS.providers),
    destinations: pickList(raw.destinations, DEFAULT_BUSINESS_SETTINGS.destinations),
    default_vat_percent: (() => {
      const vat = Number(raw.default_vat_percent);
      return Number.isFinite(vat)
        ? Math.max(0, Math.min(100, vat))
        : DEFAULT_BUSINESS_SETTINGS.default_vat_percent;
    })(),
    price_input_mode: priceMode,
    order_statuses: resolvedStatuses,
    order_status_colors: normalizeOrderStatusColors(
      raw.order_status_colors,
      resolvedStatuses,
      DEFAULT_BUSINESS_SETTINGS.order_status_colors,
    ),
    shopify_sync_schedule: schedule,
    shopify_last_synced_at:
      typeof raw.shopify_last_synced_at === 'string' && raw.shopify_last_synced_at
        ? raw.shopify_last_synced_at
        : null,
    sumup_last_synced_at:
      typeof raw.sumup_last_synced_at === 'string' && raw.sumup_last_synced_at
        ? raw.sumup_last_synced_at
        : null,
    tax_regime: (['aam', 'vat', 'kata'] as const).includes(raw.tax_regime as TaxRegime)
      ? (raw.tax_regime as TaxRegime)
      : DEFAULT_TAX_SETTINGS.tax_regime,
    income_tax_method: (['cost_ratio', 'actual', 'kata_flat'] as const).includes(
      raw.income_tax_method as IncomeTaxMethod,
    )
      ? (raw.income_tax_method as IncomeTaxMethod)
      : DEFAULT_TAX_SETTINGS.income_tax_method,
    cost_ratio_percent: (() => {
      const n = Number(raw.cost_ratio_percent);
      return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : DEFAULT_TAX_SETTINGS.cost_ratio_percent;
    })(),
    revenue_basis: (['documented_only', 'all_orders'] as const).includes(raw.revenue_basis as RevenueBasis)
      ? (raw.revenue_basis as RevenueBasis)
      : DEFAULT_TAX_SETTINGS.revenue_basis,
  };
}

export function pickDefaultChannel(settings: BusinessSettings): string {
  return (
    settings.channels.find((c) => /shopify|webshop/i.test(c)) ??
    settings.channels[0] ??
    ''
  );
}

export function pickDefaultPayment(settings: BusinessSettings): string {
  return settings.payment_methods[0] ?? '';
}

export function pickDefaultProvider(settings: BusinessSettings): string {
  return (
    settings.providers.find((p) => /shopify/i.test(p)) ??
    settings.providers.find((p) => /nincs/i.test(p)) ??
    settings.providers[0] ??
    ''
  );
}

export function pickDefaultDestination(settings: BusinessSettings): string {
  return settings.destinations[0] ?? '';
}

export function pickDefaultOrderStatus(settings: BusinessSettings): string {
  return settings.order_statuses[0] ?? 'Függőben';
}

function isOrderStatusTone(value: unknown): value is OrderStatusTone {
  return typeof value === 'string' && ORDER_STATUS_TONES.includes(value as OrderStatusTone);
}

function normalizeOrderStatusColors(
  raw: Record<string, unknown> | undefined,
  statuses: string[],
  defaults: Record<string, OrderStatusTone>,
): Record<string, OrderStatusTone> {
  const out: Record<string, OrderStatusTone> = {};
  for (const status of statuses) {
    const fromRaw = raw?.[status];
    const fromDefault = defaults[status];
    if (isOrderStatusTone(fromRaw)) {
      out[status] = fromRaw;
    } else if (isOrderStatusTone(fromDefault)) {
      out[status] = fromDefault;
    } else {
      out[status] = 'neutral';
    }
  }
  return out;
}

export function resolveOrderStatusTone(settings: BusinessSettings, status: string): OrderStatusTone {
  const key = status.trim();
  if (!key) return 'neutral';

  const direct = settings.order_status_colors[key];
  if (direct) return direct;

  const lower = key.toLowerCase();
  for (const [name, tone] of Object.entries(settings.order_status_colors)) {
    if (name.toLowerCase() === lower) return tone;
  }

  return 'neutral';
}

export function setOrderStatusColor(
  settings: BusinessSettings,
  status: string,
  tone: OrderStatusTone,
): BusinessSettings {
  return {
    ...settings,
    order_status_colors: { ...settings.order_status_colors, [status]: tone },
  };
}

export function syncOrderStatusColors(settings: BusinessSettings): BusinessSettings {
  const colors = { ...settings.order_status_colors };
  for (const status of settings.order_statuses) {
    if (!colors[status]) colors[status] = 'neutral';
  }
  for (const key of Object.keys(colors)) {
    if (!settings.order_statuses.includes(key)) delete colors[key];
  }
  return { ...settings, order_status_colors: colors };
}

export function businessDisplayName(household: { business_name?: string } | null | undefined): string {
  const name = (household?.business_name ?? '').trim();
  return name || 'Vállalkozás';
}
