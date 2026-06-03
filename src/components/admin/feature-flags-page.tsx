'use client';

import { useEffect } from 'react';
import { RefreshCw, ToggleLeft } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { InsightBanner } from '@/components/design/InsightBanner';
import { useAdminFeatureFlagsPageData } from '@/hooks/useAdminFeatureFlagsPageData';
import { FeatureFlagTable } from './feature-flag-table';
import {
  PLATFORM_FEATURE_CATEGORY_LABELS,
  type PlatformFeatureCategory,
} from '@/config/platform-features';
import { mergeFeatureFlagsWithCatalog } from '@/helpers/admin-helpers';

export function FeatureFlagsPage({
  category,
  categories,
  title = 'Platform admin / Rendszer funkciók',
  description = 'Globális rendszerkapcsolók, amelyek minden felhasználóra hatnak.',
}: {
  category?: PlatformFeatureCategory;
  categories?: PlatformFeatureCategory[];
  title?: string;
  description?: string;
}) {
  const data = useAdminFeatureFlagsPageData();
  const filter = categories ?? (category ? [category] : ['system', 'platform']);
  const flags = mergeFeatureFlagsWithCatalog(data.featureFlags, filter);

  useEffect(() => {
    void data.refreshFeatureFlags();
  }, [data.refreshFeatureFlags]);

  const bannerTitle =
    filter.length === 1
      ? PLATFORM_FEATURE_CATEGORY_LABELS[filter[0]]
      : 'Globális feature flag-ek';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/users' },
          { label: title.replace('Platform admin / ', '') },
        ]}
        title={title}
        description={description}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void data.refreshFeatureFlags()}
            disabled={data.isFeatureFlagsRefreshing}
          >
            <RefreshCw size={14} className={data.isFeatureFlagsRefreshing ? 'animate-spin' : ''} />
            Frissítés
          </Button>
        }
      />

      <InsightBanner tone="info" icon={ToggleLeft} title={bannerTitle}>
        {description}
        {filter.includes('integration') ? (
          <span className="block mt-2 text-sm">
            Itt kapcsolod be a webshop importokat platform szinten. A bolt URL-jét és kulcsait a Beállítások → Modulok →
            Vállalkozás alatt adod meg háztartásonként.
          </span>
        ) : null}
        {filter.includes('ai') ? (
          <span className="block mt-2 text-sm">
            A „Havi pénzügyi tanácsadó” az irányítópulton jelenik meg widgetként. A „Mit fizessek előbb?” és spórolási
            javaslatok a Költségvetés oldalon, az ÁFA kimutatás a Vállalkozás modulban látható, ha be vannak kapcsolva.
          </span>
        ) : null}
      </InsightBanner>

      {data.isFeatureFlagsLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <FeatureFlagTable
          flags={flags}
          togglingKey={data.togglingKey}
          onToggle={(key, value) => void data.toggleFeatureFlag(key, value)}
          emptyDescription={
            filter.includes('integration')
              ? 'Nincs integráció kapcsoló — frissítsd az oldalt, vagy futtasd a backend migrációt.'
              : filter.includes('ai')
                ? 'Nincs AI kapcsoló — frissítsd az oldalt, vagy futtasd a backend migrációt.'
                : 'A globális feature flag-ek még nem lettek konfigurálva.'
          }
        />
      )}
    </div>
  );
}
