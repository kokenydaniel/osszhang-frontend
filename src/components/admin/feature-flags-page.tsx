'use client';

import { RefreshCw, ToggleLeft } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { InsightBanner } from '@/components/design/InsightBanner';
import { useAdminFeatureFlagsPageData } from '@/hooks/useAdminFeatureFlagsPageData';
import { FeatureFlagTable } from './feature-flag-table';

export function FeatureFlagsPage() {
  const data = useAdminFeatureFlagsPageData();

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
            onClick={() => void data.refreshFeatureFlags()}
            disabled={data.isFeatureFlagsRefreshing}
          >
            <RefreshCw size={14} className={data.isFeatureFlagsRefreshing ? 'animate-spin' : ''} />
            Frissítés
          </Button>
        }
      />

      <InsightBanner tone="info" icon={ToggleLeft} title="Globális feature flag-ek">
        Ezek a kapcsolók az egész platformra vonatkoznak. A változtatások azonnal érvénybe lépnek minden
        háztartás és felhasználó számára.
      </InsightBanner>

      {data.isFeatureFlagsLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <FeatureFlagTable
          flags={data.featureFlags}
          togglingKey={data.togglingKey}
          onToggle={(key, value) => void data.toggleFeatureFlag(key, value)}
        />
      )}
    </div>
  );
}
