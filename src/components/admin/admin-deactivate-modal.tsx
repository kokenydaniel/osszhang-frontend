'use client';

import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { formatDisplayName } from '@/utils/person-name';
import type { AdminUser } from '@/types/admin';

type AdminDeactivateModalProps = {
  target: AdminUser | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function AdminDeactivateModal({ target, onClose, onConfirm, loading }: AdminDeactivateModalProps) {
  if (!target) return null;

  const label = formatDisplayName(target.first_name, target.last_name) || target.username;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Felhasználó inaktiválása"
      description={`${label} (@${target.username}) nem tud majd bejelentkezni, és az aktív munkamenetei is megszűnnek.`}
      size="sm"
    >
      <ModalFormFooter
        onCancel={onClose}
        onSubmit={onConfirm}
        submitLabel="Inaktiválás"
        submitType="button"
        loading={loading}
      />
    </Modal>
  );
}
