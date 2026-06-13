'use client';

import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { InsightBanner } from '@/components/design/InsightBanner';
import { useAdminProductUpdatesPageData } from '@/hooks/useAdminProductUpdatesPageData';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { ProductUpdate, ProductUpdatePayload } from '@/types/admin';
import { ProductUpdateComposePanel } from './product-update-compose-panel';
import { ProductUpdateTable } from './product-update-table';
import { ProductUpdateEditModal } from './product-update-edit-modal';

export function ProductUpdatesPage() {
  const data = useAdminProductUpdatesPageData();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const [editingUpdate, setEditingUpdate] = useState<ProductUpdate | null>(null);

  const handlePublish = async (payload: ProductUpdatePayload) => {
    await data.createProductUpdate({ ...payload, is_active: true });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/households' },
          { label: 'Újdonságok' },
        ]}
        title="Platform admin / Újdonságok"
        description="Új modul, funkció vagy integráció bejelentése — sablonból, szép nagy modallal."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void data.refreshProductUpdates()}
            disabled={data.isRefreshing}
          >
            <RefreshCw size={14} className={data.isRefreshing ? 'animate-spin' : ''} />
            Frissítés
          </Button>
        }
      />

      <InsightBanner tone="info" icon={Sparkles} title="Sablon alapú közzététel">
        Válassz modult vagy funkciót — mi megírjuk a szöveget, bullet pontokat és útmutatót. Neked elég
        aktiválni. A rendszerüzenet sáv továbbra is karbantartásra való, külön.
      </InsightBanner>

      <ProductUpdateComposePanel creating={data.creating} onPublish={handlePublish} />

      {data.isLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <ProductUpdateTable
          updates={data.productUpdates}
          togglingId={data.togglingId}
          deletingId={data.deletingId}
          onToggle={(id) => void data.toggleProductUpdateActive(id)}
          onEdit={setEditingUpdate}
          onDelete={(row) =>
            requestDelete({
              title: 'Újdonság törlése',
              message: `Biztosan törlöd: „${row.title}”?`,
              onConfirm: async () => {
                const ok = await data.deleteProductUpdate(row.id);
                if (ok && editingUpdate?.id === row.id) setEditingUpdate(null);
              },
            })
          }
        />
      )}

      <ProductUpdateEditModal
        update={editingUpdate}
        saving={data.saving}
        onClose={() => setEditingUpdate(null)}
        onSave={async (id, payload) => {
          const ok = await data.updateProductUpdate(id, payload);
          if (ok) setEditingUpdate(null);
        }}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
