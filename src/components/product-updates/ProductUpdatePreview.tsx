'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Building2,
  Check,
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
  Wand2,
} from 'lucide-react';
import classNames from 'classnames';
import { StatusPill } from '@/components/design';
import { TierBadge } from '@/components/subscription/TierBadge';
import {
  PRODUCT_UPDATE_KIND_LABELS,
  productUpdateModuleTier,
} from '@/helpers/product-update-helpers';
import config from '@/config/config';
import type { ProductUpdate } from '@/types/admin';

const HERO_ICONS: Record<string, LucideIcon> = {
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
  Wand2,
};

type ProductUpdatePreviewData = {
  title: string;
  subtitle?: string | null;
  body: string;
  bullets?: string[];
  location_hint?: string | null;
  kind?: ProductUpdate['kind'];
  module_id?: string | null;
  hero_icon?: string | null;
};

type ProductUpdatePreviewProps = {
  update: ProductUpdatePreviewData;
  className?: string;
  compact?: boolean;

  embedded?: boolean;
};

export function resolveProductUpdateHeroIcon(heroIcon: string | null | undefined, moduleId: string | null | undefined) {
  if (heroIcon && HERO_ICONS[heroIcon]) return HERO_ICONS[heroIcon];
  if (moduleId === 'budget') return Wallet;
  if (moduleId === 'savings') return PiggyBank;
  if (moduleId === 'debts') return TrendingDown;
  if (moduleId === 'utilities') return Droplets;
  if (moduleId === 'meters') return Gauge;
  if (moduleId === 'business') return ShoppingBag;
  if (moduleId === 'pocket_money') return Coins;
  if (moduleId === 'insurance') return Shield;
  if (moduleId === 'rental') return Building2;
  if (moduleId === 'receivables') return HandCoins;
  if (moduleId === 'travel_planner') return MapPinned;
  return Sparkles;
}

export function ProductUpdatePreview({
  update,
  className,
  compact = false,
  embedded = false,
}: ProductUpdatePreviewProps) {
  const Icon = resolveProductUpdateHeroIcon(update.hero_icon, update.module_id);
  const kindLabel = PRODUCT_UPDATE_KIND_LABELS[update.kind ?? 'general'] ?? PRODUCT_UPDATE_KIND_LABELS.general;
  const moduleTier = update.module_id ? productUpdateModuleTier(update.module_id) : null;
  const moduleLabel =
    update.module_id && config.modules.labels[update.module_id as keyof typeof config.modules.labels]
      ? config.modules.labels[update.module_id as keyof typeof config.modules.labels]
      : null;

  return (
    <div
      className={classNames(
        embedded ? 'bg-card' : 'overflow-hidden rounded-2xl border border-border bg-card shadow-lg',
        className,
      )}
    >
      <div className="relative overflow-hidden border-b border-border/70 bg-gradient-to-br from-primary/15 via-violet-500/10 to-emerald-500/10 px-6 py-8 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-emerald-400/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-background/80 text-primary shadow-lg backdrop-blur-sm">
            <Icon size={compact ? 24 : 30} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status="info" size="xs">
                {kindLabel}
              </StatusPill>
              {moduleLabel ? (
                <StatusPill status="neutral" size="xs">
                  {moduleLabel}
                </StatusPill>
              ) : null}
              {moduleTier ? <TierBadge tier={moduleTier} /> : null}
            </div>
            <div>
              <h3
                id={embedded ? 'product-update-title' : undefined}
                className={classNames(
                  'font-semibold tracking-tight text-foreground',
                  compact ? 'text-lg' : 'text-2xl sm:text-[1.65rem] leading-tight',
                )}
              >
                {update.title}
              </h3>
              {update.subtitle?.trim() ? (
                <p className={classNames('text-muted-foreground mt-2', compact ? 'text-sm' : 'text-base leading-relaxed')}>
                  {update.subtitle.trim()}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={classNames('space-y-5', compact ? 'p-5' : 'p-6 sm:p-8')}>
        <p className={classNames('text-foreground leading-relaxed', compact ? 'text-sm' : 'text-[0.95rem]')}>
          {update.body}
        </p>

        {update.bullets?.length ? (
          <div className={classNames('grid gap-2.5', !compact && 'sm:grid-cols-1')}>
            {update.bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-3"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className={classNames('text-foreground leading-relaxed', compact ? 'text-sm' : 'text-sm sm:text-[0.925rem]')}>
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {update.location_hint?.trim() ? (
          <div className="rounded-xl border border-sky-500/25 bg-gradient-to-r from-sky-500/8 to-transparent px-4 py-3.5">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-200">
              Hol találod
            </p>
            <p className="text-sm text-foreground mt-1.5 leading-relaxed">{update.location_hint.trim()}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
