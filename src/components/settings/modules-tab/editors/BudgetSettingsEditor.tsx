'use client';

import { useMemo } from 'react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HELP } from '@/config/help';
import { setCategoryColor, type BudgetSettings } from '@/settings/budget';

function normalizeCategoryLabel(cat: unknown): string {
  if (typeof cat === 'string') return cat.trim();
  if (cat && typeof cat === 'object' && 'name' in cat) {
    return String((cat as { name?: string }).name ?? '').trim();
  }
  return String(cat ?? '').trim();
}

function collectCategoryNames(categories: unknown[], settings: BudgetSettings): string[] {
  const names = new Set<string>();
  for (const cat of categories) {
    const trimmed = normalizeCategoryLabel(cat);
    if (trimmed) names.add(trimmed);
  }
  for (const group of settings.category_groups) {
    for (const cat of group.categories) {
      const trimmed = normalizeCategoryLabel(cat);
      if (trimmed) names.add(trimmed);
    }
    const groupName = group.name?.trim() ?? '';
    if (groupName && group.categories.length === 0) {
      names.add(groupName);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'hu'));
}

export function BudgetSettingsEditor({
  value,
  onChange,
  categories,
}: {
  value: BudgetSettings;
  onChange: (next: BudgetSettings) => void;
  categories: unknown[];
}) {
  const categoryNames = useMemo(
    () => collectCategoryNames(categories, value),
    [categories, value],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h5 className="text-sm font-semibold text-foreground">Kategória színek</h5>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Minden költségvetés-kategóriához válassz színt — megjelenik a havi és éves nézetben, valamint a tételeknél.
          </p>
        </div>
        {categoryNames.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border px-4 py-3">
            Először adj hozzá kategóriákat lent, utána itt színezheted őket.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {categoryNames.map((cat, index) => {
              const color =
                value.category_colors[cat] ??
                value.category_groups.find(
                  (g) => g.categories.includes(cat) || g.name.trim() === cat,
                )?.color ??
                '#64748b';
              const inputId = `budget-cat-color-${index}`;
              return (
                <div
                  key={cat}
                  className="grid grid-cols-[auto_minmax(0,1fr)_2.75rem] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-border/80"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-foreground leading-snug break-words">
                    {cat}
                  </span>
                  <input
                    id={inputId}
                    type="color"
                    value={color}
                    onChange={(e) => onChange(setCategoryColor(value, cat, e.target.value))}
                    className="h-9 w-11 cursor-pointer rounded-md border border-border bg-background p-0.5"
                    aria-label={`${cat} színe`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FormField label="Havi klónozás alapértelmezése" info={HELP.budget?.cloneMonth}>
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
          value={value.clone_mode}
          onChange={(e) =>
            onChange({ ...value, clone_mode: e.target.value as BudgetSettings['clone_mode'] })
          }
        >
          <option value="all">Minden tétel az előző hónapból</option>
          <option value="budget_only">Csak keretes tételek</option>
          <option value="fixed_recurring">Keretes, nem tartalék tételek</option>
        </select>
      </FormField>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Kimaradt bevétel figyelmeztetés</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dashboardon és a költségvetésben jelzi, ha elmaradt a várható bevétel.
          </p>
        </div>
        <Switch
          checked={value.missed_income_enabled}
          onCheckedChange={(checked) => onChange({ ...value, missed_income_enabled: checked })}
          aria-label="Kimaradt bevétel"
        />
      </div>

      {value.missed_income_enabled ? (
        <FormField
          label="Türelmi napok esedékesség után"
          info="Ennyi napot várunk az esedékesség után, mielőtt „kimaradt” figyelmeztetést mutatunk."
        >
          <Input
            type="number"
            min={0}
            max={60}
            value={value.missed_income_grace_days}
            onChange={(e) =>
              onChange({
                ...value,
                missed_income_grace_days: Math.max(0, Math.min(60, Number(e.target.value) || 0)),
              })
            }
          />
        </FormField>
      ) : null}
    </div>
  );
}
