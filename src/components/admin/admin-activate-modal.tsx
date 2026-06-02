'use client';

import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { formatDisplayName } from '@/utils/person-name';
import type { AdminUser } from '@/types/admin';

type AdminActivateModalProps = {
  target: AdminUser | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function AdminActivateModal({ target, onClose, onConfirm, loading }: AdminActivateModalProps) {
  if (!target) return null;

  const label = formatDisplayName(target.first_name, target.last_name) || target.username;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Felhasználó aktiválása"
      description={`Biztosan aktiválod ${label} (@${target.username}) fiókját?`}
      size="sm"
    >
      <ModalFormFooter
        onCancel={onClose}
        onSubmit={onConfirm}
        submitLabel="Aktiválás"
        submitType="button"
        loading={loading}
      />
    </Modal>
  );
}
