'use client';

import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { useAdminUi } from '@/components/modules/admin/AdminUiContext';
import { formatDisplayName } from '@/lib/personName';

interface AdminActivateModalProps {
  onConfirm: () => void;
  loading?: boolean;
}

export function AdminActivateModal({ onConfirm, loading }: AdminActivateModalProps) {
  const ui = useAdminUi();
  const target = ui.activateTarget;
  if (!target) return null;

  const label = formatDisplayName(target.firstName, target.lastName) || target.username;

  return (
    <Modal
      isOpen={Boolean(target)}
      onClose={ui.closeActivateModal}
      title="Felhasználó aktiválása"
      description={`Biztosan aktiválod ${label} (@${target.username}) fiókját?`}
      size="sm"
    >
      <ModalFormFooter
        onCancel={ui.closeActivateModal}
        onSubmit={onConfirm}
        submitLabel="Aktiválás"
        submitType="button"
        loading={loading}
      />
    </Modal>
  );
}
