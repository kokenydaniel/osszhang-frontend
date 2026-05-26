'use client';

import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { InsightBanner } from '@/components/design/InsightBanner';
import { FeatureFlagTable } from '@/components/modules/admin/feature-flag-table';
import { useAdminLogic } from '@/components/modules/admin/hooks/useAdminLogic';
import { ToggleLeft } from 'lucide-react';

export function FeatureFlagsPage() {
  const {
    featureFlags,
    isFeatureFlagsLoading,
    isFeatureFlagsRefreshing,
    togglingKey,
    refreshFeatureFlags,
    toggleFeatureFlag,
  } = useAdminLogic();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/users' },
          { label: 'Rendszer funkciók' },
        ]}
        title="Platform admin / Rendszer funkciók"
        description="Globális rendszerkapcsolók, amelyek minden felhasználóra hatnak."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshFeatureFlags()}
            disabled={isFeatureFlagsRefreshing}
          >
            <RefreshCw size={14} className={isFeatureFlagsRefreshing ? 'animate-spin' : ''} />
            Frissítés
          </Button>
        }
      />

      <InsightBanner tone="info" icon={ToggleLeft} title="Globális feature flag-ek">
        Ezek a kapcsolók az egész platformra vonatkoznak. A változtatások azonnal érvénybe lépnek minden
        háztartás és felhasználó számára.
      </InsightBanner>

      {isFeatureFlagsLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <FeatureFlagTable
          flags={featureFlags}
          togglingKey={togglingKey}
          onToggle={(key, value) => void toggleFeatureFlag(key, value)}
        />
      )}
    </div>
  );
}
