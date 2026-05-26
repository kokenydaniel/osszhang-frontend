'use client';

import { useState } from 'react';
import { RefreshCw, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { InsightBanner } from '@/components/design/InsightBanner';
import { SegmentedControl } from '@/components/design/SegmentedControl';
import { AnnouncementTable } from '@/components/modules/admin/announcement-table';
import { useAdminLogic } from '@/components/modules/admin/hooks/useAdminLogic';
import type { SystemAnnouncementType } from '@/types/admin';

export function AnnouncementsPage() {
  const {
    announcements,
    isAnnouncementsLoading,
    isAnnouncementsRefreshing,
    creatingAnnouncement,
    togglingAnnouncementId,
    refreshAnnouncements,
    createAnnouncement,
    toggleAnnouncementActive,
  } = useAdminLogic();

  const [message, setMessage] = useState('');
  const [type, setType] = useState<SystemAnnouncementType>('info');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    const ok = await createAnnouncement({ message: trimmed, type });
    if (ok) {
      setMessage('');
      setType('info');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/users' },
          { label: 'Rendszerüzenetek' },
        ]}
        title="Platform admin / Rendszerüzenetek"
        description="Globális értesítések minden aktív felhasználónak — egyszerre csak egy lehet aktív."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshAnnouncements()}
            disabled={isAnnouncementsRefreshing}
          >
            <RefreshCw size={14} className={isAnnouncementsRefreshing ? 'animate-spin' : ''} />
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
            placeholder="pl. Ma 22:00-tól karbantartás várható…"
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

        <Button type="submit" className="self-start" loading={creatingAnnouncement}>
          {creatingAnnouncement ? 'Küldés…' : 'Új üzenet létrehozása'}
        </Button>
      </form>

      {isAnnouncementsLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <AnnouncementTable
          announcements={announcements}
          togglingId={togglingAnnouncementId}
          onToggle={(id) => void toggleAnnouncementActive(id)}
        />
      )}
    </div>
  );
}
