import config from '@/config/config';

export type BudgetCloneMode = 'all' | 'budget_only' | 'fixed_recurring';

export type BudgetCategoryGroup = {
  name: string;
  color: string;
  categories: string[];
};

export type HouseholdCurrency = 'HUF' | 'EUR' | 'USD';

export type BudgetSettings = {
  category_groups: BudgetCategoryGroup[];
  category_colors: Record<string, string>;
  clone_mode: BudgetCloneMode;
  missed_income_enabled: boolean;
  missed_income_grace_days: number;
  default_currency: HouseholdCurrency;
};

export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  ...config.moduleDefaults.budget,
  category_groups: [],
  category_colors: {},
};

type HouseholdLike = {
  budget_settings?: BudgetSettings;
  budgetSettings?: BudgetSettings;
};

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function normalizeHex(color: string | undefined, fallback: string): string {
  const hex = (color ?? '').trim();
  return HEX_COLOR.test(hex) ? hex : fallback;
}

function mergeCategoryColors(
  groups: BudgetCategoryGroup[],
  rawColors: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (rawColors) {
    for (const [cat, color] of Object.entries(rawColors)) {
      const name = cat.trim();
      if (!name) continue;
      out[name] = normalizeHex(color, '#64748b');
    }
  }
  for (const group of groups) {
    for (const cat of group.categories) {
      if (!out[cat]) {
        out[cat] = group.color;
      }
    }
  }
  return out;
}

export function resolveBudgetSettings(household?: HouseholdLike | null): BudgetSettings {
  const raw = household?.budget_settings ?? household?.budgetSettings;
  if (!raw) return { ...DEFAULT_BUDGET_SETTINGS };

  const cloneMode: BudgetCloneMode =
    raw.clone_mode === 'budget_only' || raw.clone_mode === 'fixed_recurring' ? raw.clone_mode : 'all';

  const groups = (raw.category_groups ?? [])
    .map((g) => {
      const name = g.name?.trim() ?? '';
      if (!name) return null;
      const color = normalizeHex(g.color, '#64748b');
      const categories = (g.categories ?? []).map((c) => c.trim()).filter(Boolean);
      return { name, color, categories: [...new Set(categories)] };
    })
    .filter((g): g is BudgetCategoryGroup => g !== null);

  return {
    category_groups: groups,
    category_colors: mergeCategoryColors(groups, raw.category_colors),
    clone_mode: cloneMode,
    missed_income_enabled: raw.missed_income_enabled ?? DEFAULT_BUDGET_SETTINGS.missed_income_enabled,
    missed_income_grace_days: Math.max(0, Math.min(60, Number(raw.missed_income_grace_days) || 0)),
    default_currency: (['HUF', 'EUR', 'USD'] as const).includes(raw.default_currency as HouseholdCurrency)
      ? (raw.default_currency as HouseholdCurrency)
      : DEFAULT_BUDGET_SETTINGS.default_currency,
  };
}

export function resolveDefaultCurrency(household?: HouseholdLike | null): HouseholdCurrency {
  return resolveBudgetSettings(household).default_currency;
}

export function budgetSettingsForApi(settings: BudgetSettings): BudgetSettings {
  const category_colors = { ...settings.category_colors };
  for (const group of settings.category_groups) {
    for (const cat of group.categories) {
      if (!category_colors[cat]) {
        category_colors[cat] = group.color;
      }
    }
  }

  return {
    ...settings,
    category_groups: settings.category_groups
      .map((g) => ({
        ...g,
        name: g.name.trim(),
        categories: g.categories.map((c) => c.trim()).filter(Boolean),
      }))
      .filter((g) => g.name.length > 0),
    category_colors,
  };
}

export function setCategoryColor(
  settings: BudgetSettings,
  category: string,
  color: string,
): BudgetSettings {
  const name = category.trim();
  if (!name) return settings;

  const hex = normalizeHex(color, '#64748b');
  const category_colors = { ...settings.category_colors, [name]: hex };

  const existingGroupIndex = settings.category_groups.findIndex((g) => g.categories.includes(name));
  let category_groups = settings.category_groups;

  if (existingGroupIndex >= 0) {
    category_groups = settings.category_groups.map((g, i) =>
      i === existingGroupIndex ? { ...g, color: hex } : g,
    );
  } else {
    category_groups = [
      ...settings.category_groups,
      { name, color: hex, categories: [name] },
    ];
  }

  return { ...settings, category_colors, category_groups };
}

export function resolveCategoryColor(category: string, settings: BudgetSettings): string | undefined {
  const normalized = category.trim();
  const direct = settings.category_colors[normalized];
  if (direct && HEX_COLOR.test(direct)) {
    return direct;
  }

  const lower = normalized.toLowerCase();
  for (const [cat, color] of Object.entries(settings.category_colors)) {
    if (cat.trim().toLowerCase() === lower && HEX_COLOR.test(color)) {
      return color;
    }
  }

  for (const group of settings.category_groups) {
    if (group.categories.some((c) => c.trim().toLowerCase() === lower)) {
      return group.color;
    }
  }
  return undefined;
}
