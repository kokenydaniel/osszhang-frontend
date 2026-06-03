'use client';

import { useMemo } from 'react';
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
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'hu'));
}

export function BudgetCategoryColorsEditor({
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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Minden költségvetés-kategóriához válassz színt — megjelenik a havi és éves nézetben, valamint a tételeknél.
      </p>
      {categoryNames.length === 0 ? (
        <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border px-4 py-3">
          Először adj hozzá kategóriákat, utána itt színezheted őket.
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
                <span className="text-sm font-medium text-foreground leading-snug break-words">{cat}</span>
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
  );
}
