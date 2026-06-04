'use client';

import type { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';

type EntityAttachmentsModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
};

export function EntityAttachmentsModal({
  open,
  onClose,
  title,
  description,
  children,
}: EntityAttachmentsModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      animateContent={false}
    >
      {children}
    </Modal>
  );
}
