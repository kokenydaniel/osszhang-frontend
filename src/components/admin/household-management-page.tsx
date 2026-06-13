'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { useAdminHouseholdsPageData } from '@/hooks/useAdminHouseholdsPageData';
import type { AdminHousehold, AdminHouseholdTierFilter } from '@/types/admin';
import { AdminHouseholdsToolbar } from './admin-households-toolbar';
import { AdminHouseholdTable } from './admin-household-table';

export function HouseholdManagementPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<AdminHouseholdTierFilter>('all');
  const [page, setPage] = useState(1);

  const data = useAdminHouseholdsPageData({ search, tierFilter, page });

  const openHousehold = useCallback(
    (household: AdminHousehold) => {
      router.push(`/admin/households/${household.id}`);
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/households' },
          { label: 'Háztartások' },
        ]}
        title="Platform admin / Háztartások"
        description="Háztartások, előfizetések, admin grantek és tagok kezelése."
        actions={
          <Button variant="outline" size="sm" onClick={() => void data.refreshHouseholds()} disabled={data.isRefreshing}>
            <RefreshCw size={14} className={data.isRefreshing ? 'animate-spin' : ''} />
            Frissítés
          </Button>
        }
        meta={
          data.meta ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {data.meta.total} háztartás
            </span>
          ) : null
        }
      />

      <AdminHouseholdsToolbar
        search={search}
        tierFilter={tierFilter}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onTierFilterChange={(value) => {
          setTierFilter(value);
          setPage(1);
        }}
      />

      {data.isLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <AdminHouseholdTable households={data.households} onRowClick={openHousehold} />
      )}

      {data.meta && data.meta.last_page > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {data.meta.current_page}. / {data.meta.last_page} oldal
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.current_page <= 1}
              onClick={() => setPage(data.meta!.current_page - 1)}
            >
              <ChevronLeft size={14} />
              Előző
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.current_page >= data.meta.last_page}
              onClick={() => setPage(data.meta!.current_page + 1)}
            >
              Következő
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
