'use client';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { ConfirmDeleteOptions } from './useConfirmDelete';

interface ConfirmDeleteDialogProps {
  pending: ConfirmDeleteOptions;
  confirmLoading: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDeleteDialog({
  pending,
  confirmLoading,
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <ConfirmModal
      isOpen
      onClose={onClose}
      onConfirm={onConfirm}
      confirmLoading={confirmLoading}
      title={pending.title}
      message={pending.message}
      confirmText={pending.confirmText}
    />
  );
}
