export type MeterTemplate = {
  name: string;
  unit: string;
  location: string;
};

export type MetersSettings = {
  default_location: string;
  units: string[];
  templates: MeterTemplate[];
};

export const DEFAULT_METERS_SETTINGS: MetersSettings = {
  default_location: 'Otthon',
  units: ['kWh', 'm³', 'GJ'],
  templates: [
    { name: 'Villany', unit: 'kWh', location: 'Otthon' },
    { name: 'Víz', unit: 'm³', location: 'Otthon' },
    { name: 'Gáz', unit: 'm³', location: 'Otthon' },
  ],
};

type HouseholdLike = {
  meters_settings?: MetersSettings;
  metersSettings?: MetersSettings;
};

export function resolveMetersSettings(household?: HouseholdLike | null): MetersSettings {
  const raw = household?.meters_settings ?? household?.metersSettings;
  if (!raw) return { ...DEFAULT_METERS_SETTINGS, templates: [...DEFAULT_METERS_SETTINGS.templates] };

  const pickList = (list: string[] | undefined, fallback: string[]) => {
    const clean = (list ?? []).map((s) => s.trim()).filter(Boolean);
    return clean.length > 0 ? [...new Set(clean)] : fallback;
  };

  const defaultLocation = (raw.default_location ?? DEFAULT_METERS_SETTINGS.default_location).trim() || DEFAULT_METERS_SETTINGS.default_location;

  const templates = (raw.templates ?? [])
    .map((row) => ({
      name: row.name?.trim() ?? '',
      unit: row.unit?.trim() || 'kWh',
      location: row.location?.trim() || defaultLocation,
    }))
    .filter((row) => row.name.length > 0);

  return {
    default_location: defaultLocation,
    units: pickList(raw.units, DEFAULT_METERS_SETTINGS.units),
    templates: templates.length > 0 ? templates : [...DEFAULT_METERS_SETTINGS.templates],
  };
}
