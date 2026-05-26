'use client';

import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { useAdminUi } from '@/components/modules/admin/AdminUiContext';
import { formatDisplayName } from '@/lib/personName';

interface AdminDeactivateModalProps {
  onConfirm: () => void;
  loading?: boolean;
}

export function AdminDeactivateModal({ onConfirm, loading }: AdminDeactivateModalProps) {
  const ui = useAdminUi();
  const target = ui.deactivateTarget;
  if (!target) return null;

  const label = formatDisplayName(target.firstName, target.lastName) || target.username;

  return (
    <Modal
      isOpen={Boolean(target)}
      onClose={ui.closeDeactivateModal}
      title="Felhasználó inaktiválása"
      description={`${label} (@${target.username}) nem tud majd bejelentkezni, és az aktív munkamenetei is megszűnnek.`}
      size="sm"
    >
      <ModalFormFooter
        onCancel={ui.closeDeactivateModal}
        onSubmit={onConfirm}
        submitLabel="Inaktiválás"
        submitType="button"
        loading={loading}
      />
    </Modal>
  );
}
