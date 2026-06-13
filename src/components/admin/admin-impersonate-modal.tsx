'use client';

import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { InsightBanner } from '@/components/design/InsightBanner';
import { formatDisplayName } from '@/utils/person-name';
import type { AdminHouseholdMember } from '@/types/admin';
import { UserCog } from 'lucide-react';

type AdminMemberActionTarget = Pick<AdminHouseholdMember, 'username' | 'first_name' | 'last_name'>;

type AdminImpersonateModalProps = {
  target: AdminMemberActionTarget | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function AdminImpersonateModal({ target, onClose, onConfirm, loading }: AdminImpersonateModalProps) {
  if (!target) return null;

  const label = formatDisplayName(target.first_name, target.last_name) || target.username;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Megszemélyesítés"
      description={`Belépsz ${label} (@${target.username}) fiókjába. Az eredeti admin munkameneted biztonságosan elmentjük.`}
      size="sm"
    >
      <InsightBanner tone="warning" icon={UserCog} title="Audit naplózás">
        A megszemélyesítés platform szinten naplózásra kerül. A munkamenet végén visszatérhetsz az admin zónába.
      </InsightBanner>
      <ModalFormFooter
        onCancel={onClose}
        onSubmit={onConfirm}
        submitLabel="Megszemélyesítés indítása"
        submitType="button"
        loading={loading}
      />
    </Modal>
  );
}
