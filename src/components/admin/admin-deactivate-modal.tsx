'use client';

import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { formatDisplayName } from '@/utils/person-name';
import type { AdminHouseholdMember } from '@/types/admin';

type AdminMemberActionTarget = Pick<AdminHouseholdMember, 'username' | 'first_name' | 'last_name'>;

type AdminDeactivateModalProps = {
  target: AdminMemberActionTarget | null;
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
      description={`${label} (@${target.username}) fiókja zárolva lesz — nem jelentkezhet be, és minden aktív munkamenete megszűnik.`}
      size="sm"
    >
      <ul className="mb-1 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li>A felhasználó adatai és a háztartásban rögzített tételei megmaradnak.</li>
        <li>Bejelentkezéskor „A fiók inaktív.” hibaüzenetet kap.</li>
        <li>Megszemélyesítés és további admin műveletek csak aktiválás után lehetségesek.</li>
        <li>Bármikor visszaaktiválhatod a tagok listájából.</li>
      </ul>
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
