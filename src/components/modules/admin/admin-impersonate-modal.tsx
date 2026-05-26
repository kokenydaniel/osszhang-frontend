'use client';

import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { InsightBanner } from '@/components/design/InsightBanner';
import { useAdminUi } from '@/components/modules/admin/AdminUiContext';
import { formatDisplayName } from '@/lib/personName';
import { UserCog } from 'lucide-react';

interface AdminImpersonateModalProps {
  onConfirm: () => void;
  loading?: boolean;
}

export function AdminImpersonateModal({ onConfirm, loading }: AdminImpersonateModalProps) {
  const ui = useAdminUi();
  const target = ui.impersonateTarget;
  if (!target) return null;

  const label = formatDisplayName(target.firstName, target.lastName) || target.username;

  return (
    <Modal
      isOpen={Boolean(target)}
      onClose={ui.closeImpersonateModal}
      title="Megszemélyesítés"
      description={`Belépsz ${label} (@${target.username}) fiókjába. Az eredeti admin munkameneted biztonságosan elmentjük.`}
      size="sm"
    >
      <InsightBanner tone="warning" icon={UserCog} title="Audit naplózás">
        A megszemélyesítés platform szinten naplózásra kerül. A munkamenet végén visszatérhetsz az admin zónába.
      </InsightBanner>
      <ModalFormFooter
        onCancel={ui.closeImpersonateModal}
        onSubmit={onConfirm}
        submitLabel="Megszemélyesítés indítása"
        submitType="button"
        loading={loading}
      />
    </Modal>
  );
}
