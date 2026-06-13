'use client';

import { useState } from 'react';
import { Webhook } from 'lucide-react';
import { PageHeader, DataTable, EmptyState, InsightBanner, type DataTableColumn } from '@/components/design';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminWebhooksPageData } from '@/hooks/useAdminWebhooksPageData';

type WebhookRow = {
  id: number;
  url: string;
  events: string[];
  is_active: boolean;
};

export function WebhooksPage() {
  const { rows, loading, createWebhook, removeWebhook, refresh } = useAdminWebhooksPageData();
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const columns: DataTableColumn<WebhookRow>[] = [
    { key: 'url', header: 'URL', cell: (row) => <span className="text-sm break-all">{row.url}</span> },
    {
      key: 'events',
      header: 'Események',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.events.join(', ')}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => void removeWebhook(row.id)}>
          Törlés
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/households' },
          { label: 'Webhook-ok' },
        ]}
        title="Platform admin / Webhook-ok"
        description="Kimenő események külső rendszerek felé (pl. Slack, saját szerver)."
      />

      <InsightBanner tone="info" icon={Webhook} title="Mit csinál a webhook?">
        Ha megadsz egy URL-t, a rendszer később HTTP POST kérést küldhet oda bizonyos eseményekkor (pl. admin
        művelet, rendelés import). Jelenleg a webhook regisztrálása és titkos kulcs generálása működik; az automatikus
        eseményküldés fokozatosan bővül. A cél URL-nek nyilvánosan elérhetőnek kell lennie és 200-as választ kell
        adnia.
      </InsightBanner>

      <div className="flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="max-w-lg" />
        <Button
          type="button"
          disabled={creating || !url.trim()}
          onClick={async () => {
            setCreating(true);
            try {
              await createWebhook(url.trim());
              setUrl('');
            } finally {
              setCreating(false);
            }
          }}
        >
          Hozzáadás
        </Button>
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          Frissítés
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          minWidth="640px"
          empty={
            <EmptyState icon={Webhook} title="Nincs webhook" description="Adj hozzá egy URL-t a kimenő eseményekhez." />
          }
        />
      )}
    </div>
  );
}
