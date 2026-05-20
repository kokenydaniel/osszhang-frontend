'use client';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { ConfirmDeleteOptions } from './useConfirmDelete';

interface ConfirmDeleteDialogProps {
  pending: ConfirmDeleteOptions;
  onClose: () => void;
}

export function ConfirmDeleteDialog({ pending, onClose }: ConfirmDeleteDialogProps) {
  return (
    <ConfirmModal
      isOpen
      onClose={onClose}
      onConfirm={pending.onConfirm}
      title={pending.title}
      message={pending.message}
      confirmText={pending.confirmText}
    />
  );
}
