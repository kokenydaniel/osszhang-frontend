'use client';

import { EntityAttachmentsModal } from '@/components/attachments/entity-attachments-modal';
import { InsurancePolicyAttachments } from './insurance-policy-attachments';
import type { InsurancePolicy } from '@/types/insurance';

type InsuranceDocumentsModalProps = {
  open: boolean;
  policy: InsurancePolicy | null;
  canEdit: boolean;
  onClose: () => void;
  onCountChange?: (policyId: number, count: number) => void;
};

export function InsuranceDocumentsModal({
  open,
  policy,
  canEdit,
  onClose,
  onCountChange,
}: InsuranceDocumentsModalProps) {
  if (!policy) return null;

  return (
    <EntityAttachmentsModal
      open={open}
      onClose={onClose}
      title="Szerződés dokumentumai"
      description={policy.name}
    >
      {open ? (
        <InsurancePolicyAttachments
          key={policy.id}
          policyId={policy.id}
          canEdit={canEdit}
          onCountChange={(count) => onCountChange?.(policy.id, count)}
        />
      ) : null}
    </EntityAttachmentsModal>
  );
}
