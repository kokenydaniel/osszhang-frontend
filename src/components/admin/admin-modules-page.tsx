'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { Eye, Layers, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { InsightBanner } from '@/components/design/InsightBanner';
import { useAdminFeatureFlagsPageData } from '@/hooks/useAdminFeatureFlagsPageData';
import { FeatureFlagTable } from './feature-flag-table';
import {
  formatModuleReleaseFlagLabel,
  mergeModuleReleaseFlagsWithCatalog,
} from '@/helpers/admin-helpers';
import { adminFlagPageGuideExcept } from '@/config/admin-flag-pages';
import { PLATFORM_MODULE_META, platformModuleFlagKey } from '@/config/platform-modules';
import type { ModuleId } from '@/config/config';

const LOCKED_MODULE_FLAG_KEYS = [platformModuleFlagKey('budget')];

function moduleTierLabel(key: string): string {
  const moduleId = key.replace(/^enable_module_/, '') as ModuleId;
  const tier = PLATFORM_MODULE_META[moduleId]?.tier;
  if (tier === 'premium') return 'Premium modul';
  if (tier === 'pro') return 'Pro modul';
  return 'Alap modul';
}

function moduleScopeLabel(key: string): string {
  const moduleId = key.replace(/^enable_module_/, '') as ModuleId;
  if (moduleId === 'travel_planner') {
    return 'App modul — menü és oldal (+ külön AI kapcsoló kell)';
  }
  return 'App modul — menü, oldal, háztartási beállítás';
}

export function AdminModulesPage() {
  const data = useAdminFeatureFlagsPageData();
  const flags = useMemo(
    () => mergeModuleReleaseFlagsWithCatalog(data.featureFlags),
    [data.featureFlags],
  );
  const otherPages = adminFlagPageGuideExcept('/admin/modules');

  useEffect(() => {
    void data.refreshFeatureFlags();
  }, [data.refreshFeatureFlags]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/households' },
          { label: 'Modul kiadás' },
        ]}
        title="Platform admin / Modul kiadás"
        description="App modulok kiadása — mit lát és használhat a felhasználó. Nem webshop import, nem AI eszköz, nem karbantartás."
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

      <InsightBanner tone="info" icon={Layers} title="Modul kiadás — mit csinál?">
        <p>
          <strong>Bekapcsolva:</strong> a modul megjelenhet a menüben és bekapcsolható háztartásonként (csomag és
          jogosultság szerint).
        </p>
        <p className="mt-2">
          <strong>Kikapcsolva:</strong> sima felhasználók „Hamarosan” kártyát látnak; te lifetime adminként továbbra is
          tesztelheted. A Költségvetés mindig kiadott.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ez <strong>nem</strong> ugyanaz, mint az Integrációk (webshop import) vagy az AI kapcsolók (okos elemzések
          modulokon belül).
        </p>
        <span className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Eye size={14} className="shrink-0 text-muted-foreground" />
          <Link href="/settings?tab=modules&previewModuleRelease=1" className="font-medium text-primary hover:underline">
            Hamarosan kártyák előnézete
          </Link>
        </span>
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
          onToggle={(key, value) => {
            if (LOCKED_MODULE_FLAG_KEYS.includes(key)) return;
            void data.toggleFeatureFlag(key, value);
          }}
          formatLabel={formatModuleReleaseFlagLabel}
          categoryLabel={moduleTierLabel}
          scopeLabel={moduleScopeLabel}
          showScope
          lockedKeys={LOCKED_MODULE_FLAG_KEYS}
          emptyDescription="Nincs modul kiadás kapcsoló — frissítsd az oldalt, vagy futtasd a backend migrációt."
        />
      )}
    </div>
  );
}
