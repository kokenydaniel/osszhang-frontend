'use client';

import { EntityAttachmentsModal } from '@/components/attachments/entity-attachments-modal';
import { DebtAttachments } from './debt-attachments';
import type { Debt } from '@/types';

type DebtDocumentsModalProps = {
  open: boolean;
  debt: Debt | null;
  canEdit: boolean;
  onClose: () => void;
  onCountChange?: (debtId: number, count: number) => void;
};

export function DebtDocumentsModal({
  open,
  debt,
  canEdit,
  onClose,
  onCountChange,
}: DebtDocumentsModalProps) {
  if (!debt) return null;

  return (
    <EntityAttachmentsModal
      open={open}
      onClose={onClose}
      title="Tartozás dokumentumai"
      description={debt.name}
    >
      {open ? (
        <DebtAttachments
          key={debt.id}
          debtId={debt.id}
          canEdit={canEdit}
          onCountChange={(count) => onCountChange?.(debt.id, count)}
        />
      ) : null}
    </EntityAttachmentsModal>
  );
}
