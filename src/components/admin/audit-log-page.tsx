'use client';

import { ScrollText } from 'lucide-react';
import { PageHeader, DataTable, EmptyState, InsightBanner, type DataTableColumn } from '@/components/design';
import { useAdminAuditLogsPageData } from '@/hooks/useAdminAuditLogsPageData';

type AuditRow = {
  id: number;
  action: string;
  user: { id: number; name: string } | null;
  household: { id: number; name: string } | null;
  created_at: string | null;
};

export function AuditLogPage() {
  const { rows, loading, refresh, refreshing } = useAdminAuditLogsPageData();

  const columns: DataTableColumn<AuditRow>[] = [
    {
      key: 'when',
      header: 'Időpont',
      cell: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {row.created_at ? new Date(row.created_at).toLocaleString('hu-HU') : '—'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Művelet',
      cell: (row) => <span className="text-sm font-medium">{row.action}</span>,
    },
    {
      key: 'user',
      header: 'Felhasználó',
      cell: (row) => <span className="text-sm">{row.user?.name ?? '—'}</span>,
    },
    {
      key: 'household',
      header: 'Háztartás',
      cell: (row) => <span className="text-sm">{row.household?.name ?? '—'}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/users' },
          { label: 'Audit napló' },
        ]}
        title="Platform admin / Audit napló"
        description="Admin és rendszer műveletek naplója."
        actions={
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            Frissítés
          </button>
        }
      />

      <InsightBanner tone="info" icon={ScrollText} title="Ki kerül a naplóba?">
        Nem minden felhasználó minden művelete — csak platform admin események (pl. feature flag kapcsoló, webhook
        létrehozás/törlés). A háztartási tagok költségvetési és modul műveletei jelenleg nem kerülnek ide.
      </InsightBanner>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          minWidth="700px"
          empty={
            <EmptyState icon={ScrollText} title="Üres napló" description="Még nincs rögzített admin művelet." />
          }
        />
      )}
    </div>
  );
}
