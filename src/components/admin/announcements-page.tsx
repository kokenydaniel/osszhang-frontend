'use client';

import { useState } from 'react';
import { RefreshCw, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { InsightBanner } from '@/components/design/InsightBanner';
import { SegmentedControl } from '@/components/design/SegmentedControl';
import { useAdminAnnouncementsPageData } from '@/hooks/useAdminAnnouncementsPageData';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { SystemAnnouncement, SystemAnnouncementType } from '@/types/admin';
import { AnnouncementTable } from './announcement-table';
import { AnnouncementEditModal } from './announcement-edit-modal';

export function AnnouncementsPage() {
  const data = useAdminAnnouncementsPageData();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SystemAnnouncementType>('info');
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    const ok = await data.createAnnouncement({ message: trimmed, type });
    if (ok) {
      setMessage('');
      setType('info');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/households' },
          { label: 'Rendszerüzenetek' },
        ]}
        title="Platform admin / Rendszerüzenetek"
        description="Globális értesítések minden aktív felhasználónak — egyszerre csak egy lehet aktív."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void data.refreshAnnouncements()}
            disabled={data.isAnnouncementsRefreshing}
          >
            <RefreshCw size={14} className={data.isAnnouncementsRefreshing ? 'animate-spin' : ''} />
            Frissítés
          </Button>
        }
      />

      <InsightBanner tone="info" icon={Megaphone} title="Broadcast üzenetek">
        Az aktivált üzenet azonnal megjelenik minden bejelentkezett felhasználó tetején. Egy új aktiválás
        automatikusan kikapcsolja a korábbi aktív üzenetet.
      </InsightBanner>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4"
      >
        <div className="space-y-1.5">
          <FieldLabel>Üzenet szövege</FieldLabel>
          <Input
            placeholder="pl. Ma 22:00-től karbantartás várható…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            minLength={3}
            maxLength={2000}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Típus</FieldLabel>
          <SegmentedControl
            variant="choice"
            value={type}
            onChange={(value) => setType(value as SystemAnnouncementType)}
            animated={false}
            options={[
              { value: 'info', label: 'Információ', tone: 'primary', description: 'Kék, semleges értesítés' },
              { value: 'warning', label: 'Figyelmeztetés', tone: 'accent', description: 'Sárga, fontos infó' },
              { value: 'danger', label: 'Sürgős', tone: 'negative', description: 'Piros, kritikus üzenet' },
            ]}
          />
        </div>

        <Button type="submit" className="self-start" loading={data.creatingAnnouncement}>
          {data.creatingAnnouncement ? 'Küldés…' : 'Új üzenet létrehozása'}
        </Button>
      </form>

      {data.isAnnouncementsLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <AnnouncementTable
          announcements={data.announcements}
          togglingId={data.togglingAnnouncementId}
          deletingId={data.deletingAnnouncementId}
          onToggle={(id) => void data.toggleAnnouncementActive(id)}
          onEdit={setEditingAnnouncement}
          onDelete={(row) =>
            requestDelete({
              title: 'Üzenet törlése',
              message: 'A rendszerüzenet véglegesen törlődik. Biztosan folytatod?',
              onConfirm: async () => {
                const ok = await data.deleteAnnouncement(row.id);
                if (ok && editingAnnouncement?.id === row.id) setEditingAnnouncement(null);
              },
            })
          }
        />
      )}

      <AnnouncementEditModal
        announcement={editingAnnouncement}
        saving={data.savingAnnouncement}
        onClose={() => setEditingAnnouncement(null)}
        onSave={async (id, payload) => {
          const ok = await data.updateAnnouncement(id, payload);
          if (ok) setEditingAnnouncement(null);
        }}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
