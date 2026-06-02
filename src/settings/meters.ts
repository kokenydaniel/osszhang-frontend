import config from '@/config/config';

export type MeterTemplate = {
  name: string;
  unit: string;
  location: string;
};

export type MeterLocationGroup = {
  name: string;
  locations: string[];
};

export type MetersSettings = {
  default_location: string;
  units: string[];
  templates: MeterTemplate[];
  reading_reminder_day: number;
  consumption_alert_percent: number;
  show_annual_summary_on_dashboard: boolean;
  location_groups: MeterLocationGroup[];
};

export const DEFAULT_METERS_SETTINGS: MetersSettings = {
  ...config.moduleDefaults.meters,
  templates: [...config.moduleDefaults.meters.templates],
  location_groups: config.moduleDefaults.meters.location_groups.map((g) => ({
    name: g.name,
    locations: [...g.locations],
  })),
};

type HouseholdLike = {
  meters_settings?: MetersSettings;
  metersSettings?: MetersSettings;
};

function normalizeLocationGroups(raw: MeterLocationGroup[] | undefined): MeterLocationGroup[] {
  return (raw ?? [])
    .map((g) => {
      const name = g.name?.trim() ?? '';
      if (!name) return null;
      const locations = (g.locations ?? []).map((l) => l.trim()).filter(Boolean);
      return { name, locations: locations.length > 0 ? [...new Set(locations)] : [name] };
    })
    .filter((g): g is MeterLocationGroup => g !== null);
}

export function metersSettingsForApi(settings: MetersSettings): MetersSettings {
  return {
    ...settings,
    templates: settings.templates.filter((t) => t.name.trim().length > 0),
    location_groups: settings.location_groups
      .map((g) => ({
        name: g.name.trim(),
        locations: g.locations.map((l) => l.trim()).filter(Boolean),
      }))
      .filter((g) => g.name.length > 0),
  };
}

export function resolveMetersSettings(household?: HouseholdLike | null): MetersSettings {
  const raw = household?.meters_settings ?? household?.metersSettings;
  if (!raw) {
    return {
      ...DEFAULT_METERS_SETTINGS,
      templates: [...DEFAULT_METERS_SETTINGS.templates],
      location_groups: DEFAULT_METERS_SETTINGS.location_groups.map((g) => ({
        name: g.name,
        locations: [...g.locations],
      })),
    };
  }

  const normalizeList = (list: string[] | undefined, fallback: string[]) => {
    const clean = (list ?? []).map((s) => s.trim()).filter(Boolean);
    return clean.length > 0 ? [...new Set(clean)] : fallback;
  };

  const defaultLocation =
    (raw.default_location ?? DEFAULT_METERS_SETTINGS.default_location).trim() ||
    DEFAULT_METERS_SETTINGS.default_location;

  const templates = (raw.templates ?? [])
    .map((row) => ({
      name: row.name?.trim() ?? '',
      unit: row.unit?.trim() || 'kWh',
      location: row.location?.trim() || defaultLocation,
    }))
    .filter((row) => row.name.length > 0);

  const locationGroups =
    raw.location_groups !== undefined
      ? normalizeLocationGroups(raw.location_groups)
      : DEFAULT_METERS_SETTINGS.location_groups.map((g) => ({
          name: g.name,
          locations: [...g.locations],
        }));

  return {
    default_location: defaultLocation,
    units: normalizeList(raw.units, DEFAULT_METERS_SETTINGS.units),
    templates: templates.length > 0 ? templates : [...DEFAULT_METERS_SETTINGS.templates],
    reading_reminder_day: Math.max(0, Math.min(28, Number(raw.reading_reminder_day) || 0)),
    consumption_alert_percent: Math.max(0, Math.min(200, Number(raw.consumption_alert_percent) || 0)),
    show_annual_summary_on_dashboard:
      raw.show_annual_summary_on_dashboard ?? DEFAULT_METERS_SETTINGS.show_annual_summary_on_dashboard,
    location_groups: locationGroups,
  };
}
