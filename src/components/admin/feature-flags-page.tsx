'use client';

import Link from 'next/link';
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
import { adminFlagPageGuideExcept } from '@/config/admin-flag-pages';
import { mergeFeatureFlagsWithCatalog } from '@/helpers/admin-helpers';

export function FeatureFlagsPage({
  category,
  categories,
  title = 'Platform admin / Karbantartás & béta',
  description = 'Üzemeltetési kapcsolók — karbantartás és béta üzemmód.',
  currentRoute = '/admin/features',
}: {
  category?: PlatformFeatureCategory;
  categories?: PlatformFeatureCategory[];
  title?: string;
  description?: string;
  currentRoute?: string;
}) {
  const data = useAdminFeatureFlagsPageData();
  const filter = categories ?? (category ? [category] : ['system']);
  const flags = mergeFeatureFlagsWithCatalog(data.featureFlags, filter);
  const otherPages = adminFlagPageGuideExcept(currentRoute);

  useEffect(() => {
    void data.refreshFeatureFlags();
  }, [data.refreshFeatureFlags]);

  const bannerTitle =
    filter.length === 1
      ? PLATFORM_FEATURE_CATEGORY_LABELS[filter[0]]
      : 'Platform kapcsolók';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/households' },
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
        <p>{description}</p>
        {filter.includes('integration') ? (
          <p className="mt-2 text-sm">
            Itt csak a platform engedélyt kapcsolod. A bolt URL-jét és API kulcsot háztartásonként a Beállítások →
            Modulok → Vállalkozás alatt adják meg — ehhez Premium csomag és a Vállalkozás modul kiadása is kell.
          </p>
        ) : null}
        {filter.includes('ai') ? (
          <p className="mt-2 text-sm">
            Ezek modulokon belüli AI eszközök — nem ugyanaz, mint a Modul kiadás. Az utazástervezőhöz két kapcsoló
            kell: <strong>Utazástervező modul</strong> (Modul kiadás) és <strong>Utazás tervező AI</strong> (itt).
          </p>
        ) : null}
        {filter.includes('platform') ? (
          <p className="mt-2 text-sm">
            Ezek nem app modulok. A Webhook-ok és Audit napló admin oldalak mindig elérhetők — itt a szolgáltatás
            működését kapcsolod ki vagy be.
          </p>
        ) : null}
        {filter.includes('system') ? (
          <p className="mt-2 text-sm">
            Vészhelyzeti és teszt kapcsolók. Modulok, webshop importok és AI eszközök külön admin menüpontok alatt
            állíthatók.
          </p>
        ) : null}
      </InsightBanner>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Más kapcsoló típusok</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {otherPages.map((page) => (
            <li key={page.route}>
              <Link href={page.route} className="group block rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/30">
                <span className="text-sm font-medium text-foreground group-hover:text-primary">{page.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">{page.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {data.isFeatureFlagsLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <FeatureFlagTable
          flags={flags}
          togglingKey={data.togglingKey}
          onToggle={(key, value) => void data.toggleFeatureFlag(key, value)}
          showScope
          emptyDescription={
            filter.includes('integration')
              ? 'Nincs integráció kapcsoló — frissítsd az oldalt, vagy futtasd a backend migrációt.'
              : filter.includes('ai')
                ? 'Nincs AI kapcsoló — frissítsd az oldalt, vagy futtasd a backend migrációt.'
                : filter.includes('platform')
                  ? 'Nincs platform szolgáltatás kapcsoló — frissítsd az oldalt, vagy futtasd a backend migrációt.'
                  : 'Az üzemeltetési kapcsolók még nem lettek konfigurálva.'
          }
        />
      )}
    </div>
  );
}
