'use client';

import { useMemo, useState } from 'react';
import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Building2,
  Coins,
  Droplets,
  Gauge,
  HandCoins,
  LayoutGrid,
  MapPinned,
  Paperclip,
  PiggyBank,
  Shield,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductUpdatePreview } from '@/components/product-updates/ProductUpdatePreview';
import {
  mergeProductUpdatePayload,
  PRODUCT_UPDATE_CATEGORY_LABELS,
  PRODUCT_UPDATE_TEMPLATES,
  type ProductUpdateTemplate,
  type ProductUpdateTemplateCategory,
} from '@/config/product-update-templates';
import type { ProductUpdatePayload } from '@/types/admin';

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  Wallet,
  PiggyBank,
  TrendingDown,
  Droplets,
  Gauge,
  ShoppingBag,
  Coins,
  Shield,
  Building2,
  HandCoins,
  MapPinned,
  Sparkles,
  Bot,
  Paperclip,
  LayoutGrid,
};

const CATEGORY_ORDER: ProductUpdateTemplateCategory[] = ['module', 'feature', 'integration', 'tip'];

type ProductUpdateComposePanelProps = {
  creating?: boolean;
  onPublish: (payload: ProductUpdatePayload) => void | Promise<void>;
};

export function ProductUpdateComposePanel({ creating = false, onPublish }: ProductUpdateComposePanelProps) {
  const [selectedId, setSelectedId] = useState<string>(PRODUCT_UPDATE_TEMPLATES[0]?.id ?? '');
  const [category, setCategory] = useState<ProductUpdateTemplateCategory>('module');

  const selectedTemplate = useMemo(
    () => PRODUCT_UPDATE_TEMPLATES.find((t) => t.id === selectedId) ?? PRODUCT_UPDATE_TEMPLATES[0],
    [selectedId],
  );

  const filteredTemplates = useMemo(
    () => PRODUCT_UPDATE_TEMPLATES.filter((t) => t.category === category),
    [category],
  );

  const previewPayload = selectedTemplate ? mergeProductUpdatePayload(selectedTemplate) : null;

  const selectTemplate = (template: ProductUpdateTemplate) => {
    setSelectedId(template.id);
    setCategory(template.category);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Mit jelentünk be?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Válassz sablont — a szöveg, bullet pontok és „Hol találod” automatikusan kitöltődik.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                const first = PRODUCT_UPDATE_TEMPLATES.find((t) => t.category === cat);
                if (first) setSelectedId(first.id);
              }}
              className={classNames(
                'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                category === cat
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              {PRODUCT_UPDATE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredTemplates.map((template) => {
            const Icon = TEMPLATE_ICONS[template.heroIcon] ?? Sparkles;
            const active = template.id === selectedId;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => selectTemplate(template)}
                className={classNames(
                  'flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                  active
                    ? 'border-primary bg-primary/[0.07] ring-2 ring-primary/20 shadow-sm'
                    : 'border-border bg-muted/10 hover:bg-muted/25 hover:border-border/90',
                )}
              >
                <span
                  className={classNames(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground truncate">{template.label}</span>
                  <span className="block text-[0.72rem] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                    {template.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/80">
          <Button
            size="lg"
            loading={creating}
            disabled={!previewPayload}
            onClick={() => previewPayload && void onPublish(previewPayload)}
          >
            {creating ? 'Közzététel…' : 'Létrehozás és aktiválás'}
          </Button>
          <p className="text-xs text-muted-foreground max-w-md">
            A user a jobb oldali előnézet szerinti nagy modalt látja belépéskor.
          </p>
        </div>
      </div>

      <div className="xl:sticky xl:top-6 h-fit space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Előnézet — így látja a user
        </p>
        {previewPayload ? <ProductUpdatePreview update={previewPayload} compact /> : null}
      </div>
    </div>
  );
}
