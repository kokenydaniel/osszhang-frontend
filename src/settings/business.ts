import config from '@/config/config';
import { pickList } from '@/utils/pick-list';

export type ShopifySyncSchedule = 'off' | 'hourly' | 'every_6_hours' | 'daily';

export type BusinessSettings = {
  channels: string[];
  payment_methods: string[];
  providers: string[];
  destinations: string[];
  default_vat_percent: number;
  price_input_mode: 'net' | 'gross';
  order_statuses: string[];
  shopify_sync_schedule: ShopifySyncSchedule;
  shopify_last_synced_at: string | null;
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  ...config.moduleDefaults.business,
  order_statuses: [...config.moduleDefaults.business.order_statuses],
};

type HouseholdLike = {
  business_settings?: BusinessSettings;
  businessSettings?: BusinessSettings;
};

export function resolveBusinessSettings(household?: HouseholdLike | null): BusinessSettings {
  const raw = household?.business_settings ?? household?.businessSettings;
  if (!raw) return { ...DEFAULT_BUSINESS_SETTINGS, order_statuses: [...DEFAULT_BUSINESS_SETTINGS.order_statuses] };

  const priceMode = raw.price_input_mode === 'net' ? 'net' : 'gross';
  const schedule: ShopifySyncSchedule =
    raw.shopify_sync_schedule === 'hourly' ||
    raw.shopify_sync_schedule === 'every_6_hours' ||
    raw.shopify_sync_schedule === 'daily'
      ? raw.shopify_sync_schedule
      : 'off';

  const statuses = pickList(raw.order_statuses, DEFAULT_BUSINESS_SETTINGS.order_statuses);

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
    order_statuses: statuses.length > 0 ? statuses : [...DEFAULT_BUSINESS_SETTINGS.order_statuses],
    shopify_sync_schedule: schedule,
    shopify_last_synced_at:
      typeof raw.shopify_last_synced_at === 'string' && raw.shopify_last_synced_at
        ? raw.shopify_last_synced_at
        : null,
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

export function orderStatusPillTone(
  status: string,
  statuses: string[],
): 'success' | 'warning' | 'danger' | 'neutral' {
  const index = statuses.findIndex((s) => s.toLowerCase() === status.toLowerCase());
  if (index < 0) return 'neutral';
  if (index === statuses.length - 1) return 'success';
  if (index === 0) return 'warning';
  if (index >= statuses.length - 2) return 'success';
  return 'neutral';
}

export function businessDisplayName(household: { business_name?: string } | null | undefined): string {
  const name = (household?.business_name ?? '').trim();
  return name || 'Vállalkozás';
}
