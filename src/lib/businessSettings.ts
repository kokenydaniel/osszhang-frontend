export type BusinessSettings = {
  channels: string[];
  payment_methods: string[];
  providers: string[];
  destinations: string[];
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  channels: [],
  payment_methods: [],
  providers: [],
  destinations: [],
};

type HouseholdLike = {
  business_settings?: BusinessSettings;
  businessSettings?: BusinessSettings;
};

function pickList(list: string[] | undefined, fallback: string[]): string[] {
  if (list === undefined) {
    return [...fallback];
  }
  const clean = (list ?? []).map((s) => s.trim()).filter(Boolean);
  return [...new Set(clean)];
}

export function resolveBusinessSettings(household?: HouseholdLike | null): BusinessSettings {
  const raw = household?.business_settings ?? household?.businessSettings;
  if (!raw) return { ...DEFAULT_BUSINESS_SETTINGS };

  return {
    channels: pickList(raw.channels, DEFAULT_BUSINESS_SETTINGS.channels),
    payment_methods: pickList(raw.payment_methods, DEFAULT_BUSINESS_SETTINGS.payment_methods),
    providers: pickList(raw.providers, DEFAULT_BUSINESS_SETTINGS.providers),
    destinations: pickList(raw.destinations, DEFAULT_BUSINESS_SETTINGS.destinations),
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
