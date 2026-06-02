'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { SegmentedControl, ModalFormFooter } from '@/components/design';
import type { SystemAnnouncement, SystemAnnouncementType } from '@/types/admin';

type AnnouncementEditModalProps = {
  announcement: SystemAnnouncement | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (id: number, payload: { message: string; type: SystemAnnouncementType }) => Promise<void>;
};

export function AnnouncementEditModal({
  announcement,
  saving = false,
  onClose,
  onSave,
}: AnnouncementEditModalProps) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SystemAnnouncementType>('info');

  useEffect(() => {
    if (!announcement) return;
    setMessage(announcement.message);
    setType(announcement.type);
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    await onSave(announcement.id, { message: trimmed, type });
  };

  return (
    <Modal isOpen={!!announcement} onClose={onClose} title="Üzenet szerkesztése" size="md">
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <FieldLabel>Üzenet szövege</FieldLabel>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
              { value: 'info', label: 'Információ', tone: 'primary' },
              { value: 'warning', label: 'Figyelmeztetés', tone: 'accent' },
              { value: 'danger', label: 'Sürgős', tone: 'negative' },
            ]}
          />
        </div>
        <ModalFormFooter onCancel={onClose} submitLabel="Mentés" loading={saving} />
      </form>
    </Modal>
  );
}
