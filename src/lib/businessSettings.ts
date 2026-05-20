export type BusinessSettings = {
  channels: string[];
  payment_methods: string[];
  providers: string[];
  destinations: string[];
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  channels: ['Meskán', 'Privát rendelés', 'Webshop (Shopify)', 'Hello Piac'],
  payment_methods: ['Kártya', 'Utalás', 'Utánvét', 'Készpénz'],
  providers: ['Shopify payments', 'Barion', 'SumUp', 'DPD', 'GLS', 'Foxpost', 'Nincs'],
  destinations: ['Szolgáltatónál parkol', 'Privát számla', 'Készpénz'],
};

type HouseholdLike = {
  business_settings?: BusinessSettings;
  businessSettings?: BusinessSettings;
};

export function resolveBusinessSettings(household?: HouseholdLike | null): BusinessSettings {
  const raw = household?.business_settings ?? household?.businessSettings;
  if (!raw) return { ...DEFAULT_BUSINESS_SETTINGS };

  const pick = (list: string[] | undefined, fallback: string[]) => {
    const clean = (list ?? []).map((s) => s.trim()).filter(Boolean);
    return clean.length > 0 ? [...new Set(clean)] : fallback;
  };

  return {
    channels: pick(raw.channels, DEFAULT_BUSINESS_SETTINGS.channels),
    payment_methods: pick(raw.payment_methods, DEFAULT_BUSINESS_SETTINGS.payment_methods),
    providers: pick(raw.providers, DEFAULT_BUSINESS_SETTINGS.providers),
    destinations: pick(raw.destinations, DEFAULT_BUSINESS_SETTINGS.destinations),
  };
}

export function pickDefaultChannel(settings: BusinessSettings): string {
  return (
    settings.channels.find((c) => /shopify|webshop/i.test(c)) ??
    settings.channels[0] ??
    'Webshop (Shopify)'
  );
}

export function pickDefaultPayment(settings: BusinessSettings): string {
  return settings.payment_methods[0] ?? 'Kártya';
}

export function pickDefaultProvider(settings: BusinessSettings): string {
  return (
    settings.providers.find((p) => /shopify/i.test(p)) ??
    settings.providers.find((p) => /nincs/i.test(p)) ??
    settings.providers[0] ??
    'Nincs'
  );
}

export function pickDefaultDestination(settings: BusinessSettings): string {
  return settings.destinations[0] ?? 'Szolgáltatónál parkol';
}
